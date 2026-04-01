import { describe, expect, it } from 'vitest';
import { resolveFeedbackMessage } from './catalog';

describe('feedback catalog', () => {
  it('resolves pomodoro invalidation with explicit reason label', () => {
    const message = resolveFeedbackMessage(
      'pomodoro_invalidated',
      { invalidReasonLabel: 'mudanca de rota' },
      'seed-1',
    );

    expect(message.variant).toBe('warning');
    expect(message.message.toLowerCase()).toContain('mudanca de rota');
  });

  it('resolves coins earned with numeric interpolation', () => {
    const message = resolveFeedbackMessage('coins_earned', { coins: 8 }, 'seed-2');

    expect(message.variant).toBe('motivational');
    expect(message.message).toContain('8');
  });

  it('keeps deterministic output for same seed', () => {
    const first = resolveFeedbackMessage('shop_item_purchased', { itemName: 'Mesa Aurora' }, 'fixed-seed');
    const second = resolveFeedbackMessage('shop_item_purchased', { itemName: 'Mesa Aurora' }, 'fixed-seed');

    expect(first.message).toBe(second.message);
    expect(first.dedupeKey).toBe(second.dedupeKey);
  });
});
