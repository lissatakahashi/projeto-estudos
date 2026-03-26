import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  rpcMock,
} = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpcMock: rpc };
});

vi.mock('./client', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { awardFocusSessionReward } from './walletService';

describe('walletService', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('maps rpc response for awarded reward', async () => {
    rpcMock.mockResolvedValue({
      data: [{
        awarded: true,
        awarded_amount: 5,
        new_balance: 20,
        transaction_id: 'tx-1',
      }],
      error: null,
    });

    const result = await awardFocusSessionReward({
      focusSessionId: 'session-1',
      plannedDurationSeconds: 1500,
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      awarded: true,
      awardedAmount: 5,
      newBalance: 20,
      transactionId: 'tx-1',
    });
  });

  it('returns duplicate/awarded false payload when rpc indicates no credit', async () => {
    rpcMock.mockResolvedValue({
      data: [{
        awarded: false,
        awarded_amount: 0,
        new_balance: 20,
        transaction_id: null,
      }],
      error: null,
    });

    const result = await awardFocusSessionReward({
      focusSessionId: 'session-1',
      plannedDurationSeconds: 1500,
    });

    expect(result.error).toBeNull();
    expect(result.data?.awarded).toBe(false);
    expect(result.data?.newBalance).toBe(20);
  });
});
