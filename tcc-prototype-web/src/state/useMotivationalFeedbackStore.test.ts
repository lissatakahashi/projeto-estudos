import { beforeEach, describe, expect, it } from 'vitest';
import { useMotivationalFeedbackStore } from './useMotivationalFeedbackStore';

describe('useMotivationalFeedbackStore', () => {
  beforeEach(() => {
    useMotivationalFeedbackStore.getState().reset();
  });

  it('queues next feedback while one is already active', () => {
    const store = useMotivationalFeedbackStore.getState();

    store.publishEvent('pomodoro_started', {}, { dedupeKey: 'event-1' });
    store.publishEvent('coins_earned', { coins: 5 }, { dedupeKey: 'event-2' });

    const state = useMotivationalFeedbackStore.getState();
    expect(state.active?.event).toBe('pomodoro_started');
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].event).toBe('coins_earned');
  });

  it('prevents duplicate feedback for same dedupe key in dedupe window', () => {
    const store = useMotivationalFeedbackStore.getState();

    const first = store.publishEvent('shop_item_purchased', { itemName: 'Planta Zen' }, { dedupeKey: 'purchase:item-1' });
    const second = store.publishEvent('shop_item_purchased', { itemName: 'Planta Zen' }, { dedupeKey: 'purchase:item-1' });

    expect(first).toBeTruthy();
    expect(second).toBeNull();
  });

  it('advances queue when active feedback is dismissed', () => {
    const store = useMotivationalFeedbackStore.getState();

    store.publishEvent('pomodoro_started', {}, { dedupeKey: 'start-1' });
    store.publishEvent('pomodoro_completed', {}, { dedupeKey: 'completed-1' });

    store.dismissActive();

    const state = useMotivationalFeedbackStore.getState();
    expect(state.active?.event).toBe('pomodoro_completed');
    expect(state.queue).toHaveLength(0);
  });
});
