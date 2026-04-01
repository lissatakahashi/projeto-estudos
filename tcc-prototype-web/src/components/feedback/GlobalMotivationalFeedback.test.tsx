import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMotivationalFeedbackStore } from '../../state/useMotivationalFeedbackStore';
import GlobalMotivationalFeedback from './GlobalMotivationalFeedback';

describe('GlobalMotivationalFeedback', () => {
  beforeEach(() => {
    useMotivationalFeedbackStore.getState().reset();
  });

  it('renders active feedback message from store', async () => {
    useMotivationalFeedbackStore.getState().publishEvent(
      'pomodoro_completed',
      {},
      { dedupeKey: 'pomodoro-completed-1' },
    );

    render(<GlobalMotivationalFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/sessao|bloco/i)).toBeTruthy();
    });
  });

  it('renders queued feedback after dismissing active one', async () => {
    const store = useMotivationalFeedbackStore.getState();
    store.publishEvent('pomodoro_started', {}, { dedupeKey: 'pomodoro-started-1' });
    store.publishEvent('coins_earned', { coins: 3 }, { dedupeKey: 'coins-earned-1' });

    render(<GlobalMotivationalFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/sessao iniciada|pomodoro em andamento/i)).toBeTruthy();
    });

    store.dismissActive();

    await waitFor(() => {
      expect(screen.getByText(/3 moedas/i)).toBeTruthy();
    });
  });
});
