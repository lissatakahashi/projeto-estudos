import type { FeedPetResult } from '../types/pet';

export type FeedPetDeps = {
  feedUserPet: () => Promise<{
    data: {
      success: boolean;
      reason: string;
      newBalance: number;
      fedAt: string | null;
      cooldownRemainingSeconds: number;
      pet: FeedPetResult['pet'];
    } | null;
    error: { message: string } | null;
  }>;
};

export async function feedPet(
  deps: FeedPetDeps,
  input: { userId: string | null },
): Promise<FeedPetResult> {
  if (!input.userId) {
    return {
      success: false,
      reason: 'unauthorized',
      newBalance: 0,
      fedAt: null,
      cooldownRemainingSeconds: 0,
      pet: null,
    };
  }

  const { data, error } = await deps.feedUserPet();

  if (error || !data) {
    return {
      success: false,
      reason: 'integrity_error',
      newBalance: 0,
      fedAt: null,
      cooldownRemainingSeconds: 0,
      pet: null,
    };
  }

  const reason = ((): FeedPetResult['reason'] => {
    switch (data.reason) {
      case 'fed':
      case 'insufficient_balance':
      case 'cooldown_active':
        return data.reason;
      default:
        return 'integrity_error';
    }
  })();

  return {
    success: Boolean(data.success),
    reason,
    newBalance: Number(data.newBalance ?? 0),
    fedAt: data.fedAt,
    cooldownRemainingSeconds: Number(data.cooldownRemainingSeconds ?? 0),
    pet: data.pet,
  };
}
