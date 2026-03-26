import type { FocusSessionRewardPayload, FocusSessionRewardResult } from '../types/wallet';
import { calculateFocusReward } from './calculateFocusReward';

export type AwardFocusSessionCoinsDeps = {
  awardFocusSessionReward: (input: {
    focusSessionId: string;
    plannedDurationSeconds: number;
  }) => Promise<{
    data: {
      awarded: boolean;
      awardedAmount: number;
      newBalance: number;
      transactionId: string | null;
    } | null;
    error: { message: string } | null;
  }>;
};

export type AwardFocusSessionCoinsInput = FocusSessionRewardPayload & {
  completionStatus: 'completed' | 'invalidated' | 'interrupted';
  isSessionValid: boolean;
};

export async function awardFocusSessionCoins(
  deps: AwardFocusSessionCoinsDeps,
  input: AwardFocusSessionCoinsInput,
): Promise<FocusSessionRewardResult> {
  if (input.completionStatus !== 'completed' || !input.isSessionValid) {
    return {
      awarded: false,
      awardedAmount: 0,
      newBalance: 0,
      transactionId: null,
      reason: 'not_eligible',
    };
  }

  const expectedReward = calculateFocusReward({ plannedDurationSeconds: input.plannedDurationSeconds });
  if (expectedReward <= 0) {
    return {
      awarded: false,
      awardedAmount: 0,
      newBalance: 0,
      transactionId: null,
      reason: 'not_eligible',
    };
  }

  const { data, error } = await deps.awardFocusSessionReward({
    focusSessionId: input.focusSessionId,
    plannedDurationSeconds: input.plannedDurationSeconds,
  });

  if (error || !data) {
    return {
      awarded: false,
      awardedAmount: 0,
      newBalance: 0,
      transactionId: null,
      reason: 'integrity_error',
    };
  }

  if (!data.awarded) {
    return {
      awarded: false,
      awardedAmount: 0,
      newBalance: data.newBalance,
      transactionId: null,
      reason: 'duplicate',
    };
  }

  return {
    awarded: true,
    awardedAmount: data.awardedAmount,
    newBalance: data.newBalance,
    transactionId: data.transactionId,
    reason: 'awarded',
  };
}
