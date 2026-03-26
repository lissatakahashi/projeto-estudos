import { describe, expect, it, vi } from 'vitest';
import { awardFocusSessionCoins } from './awardFocusSessionCoins';

describe('awardFocusSessionCoins', () => {
  it('awards coins for valid completed focus session', async () => {
    const awardFocusSessionReward = vi.fn().mockResolvedValue({
      data: {
        awarded: true,
        awardedAmount: 5,
        newBalance: 12,
        transactionId: 'tx-1',
      },
      error: null,
    });

    const result = await awardFocusSessionCoins(
      { awardFocusSessionReward },
      {
        userId: 'user-1',
        focusSessionId: 'session-1',
        plannedDurationSeconds: 1500,
        completionStatus: 'completed',
        isSessionValid: true,
      },
    );

    expect(result.awarded).toBe(true);
    expect(result.awardedAmount).toBe(5);
    expect(result.reason).toBe('awarded');
  });

  it('does not award when session is invalidated', async () => {
    const awardFocusSessionReward = vi.fn();

    const result = await awardFocusSessionCoins(
      { awardFocusSessionReward },
      {
        userId: 'user-1',
        focusSessionId: 'session-1',
        plannedDurationSeconds: 1500,
        completionStatus: 'invalidated',
        isSessionValid: false,
      },
    );

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('not_eligible');
    expect(awardFocusSessionReward).not.toHaveBeenCalled();
  });

  it('returns duplicate when reward already exists for the same session', async () => {
    const awardFocusSessionReward = vi.fn().mockResolvedValue({
      data: {
        awarded: false,
        awardedAmount: 0,
        newBalance: 12,
        transactionId: null,
      },
      error: null,
    });

    const result = await awardFocusSessionCoins(
      { awardFocusSessionReward },
      {
        userId: 'user-1',
        focusSessionId: 'session-1',
        plannedDurationSeconds: 1500,
        completionStatus: 'completed',
        isSessionValid: true,
      },
    );

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(result.newBalance).toBe(12);
  });
});
