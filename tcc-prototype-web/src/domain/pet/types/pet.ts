export const PET_TYPES = ['owl', 'cat', 'fox'] as const;
export type PetType = (typeof PET_TYPES)[number];

export type PetMoodState = 'hungry' | 'neutral' | 'happy' | 'satisfied';

export type UserPetState = {
  userId: string;
  petName: string;
  petType: PetType;
  hungerLevel: number;
  moodLevel: number;
  lastFedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedPetCostPolicy = {
  coins: number;
  cooldownSeconds: number;
};

export const FEED_PET_COST_POLICY: FeedPetCostPolicy = {
  coins: 5,
  cooldownSeconds: 60,
};

export function canFeedPetWithCurrentBalance(
  currentBalance: number,
  policy: FeedPetCostPolicy = FEED_PET_COST_POLICY,
): boolean {
  return Number.isFinite(currentBalance) && currentBalance >= policy.coins;
}

export function getPetFeedInsufficientFundsMessage(
  policy: FeedPetCostPolicy = FEED_PET_COST_POLICY,
): string {
  return `Você está sem moedas suficientes para alimentar seu pet. São necessárias ${policy.coins} moedas. Conclua sessões de estudo para ganhar moedas e tente novamente.`;
}

export type FeedPetReason =
  | 'fed'
  | 'unauthorized'
  | 'insufficient_balance'
  | 'cooldown_active'
  | 'integrity_error';

export type FeedPetResult = {
  success: boolean;
  reason: FeedPetReason;
  newBalance: number;
  fedAt: string | null;
  cooldownRemainingSeconds: number;
  pet: UserPetState | null;
};

export function normalizeLevel(value: number): number {
  return Math.max(0, Math.min(100, Math.floor(value)));
}

export function derivePetMoodState(pet: Pick<UserPetState, 'hungerLevel' | 'moodLevel'>): PetMoodState {
  if (pet.hungerLevel <= 30) {
    return 'hungry';
  }

  if (pet.hungerLevel >= 85 || pet.moodLevel >= 85) {
    return 'satisfied';
  }

  if (pet.hungerLevel >= 60 || pet.moodLevel >= 60) {
    return 'happy';
  }

  return 'neutral';
}

export function getPetVisualByMood(mood: PetMoodState): { emoji: string; label: string } {
  switch (mood) {
    case 'hungry':
      return { emoji: '🦉', label: 'Com fome' };
    case 'happy':
      return { emoji: '🦉', label: 'Feliz' };
    case 'satisfied':
      return { emoji: '🦉', label: 'Satisfeito' };
    default:
      return { emoji: '🦉', label: 'Neutro' };
  }
}
