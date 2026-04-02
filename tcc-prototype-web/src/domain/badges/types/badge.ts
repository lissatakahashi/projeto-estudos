export const SYSTEM_BADGE_SLUGS = [
  'first_focus_session',
  'four_focus_sessions',
  'ten_focus_sessions',
  'first_shop_purchase',
  'first_environment_item_equipped',
  'first_pet_feed',
  'wallet_balance_100',
] as const;

export type SystemBadgeSlug = (typeof SYSTEM_BADGE_SLUGS)[number];

export type BadgeCategory = 'study' | 'economy' | 'customization' | 'pet';

export type Badge = {
  badgeId: string;
  slug: SystemBadgeSlug;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserBadge = {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  createdAt: string;
  badge: Badge;
};

export type BadgeProgressSnapshot = {
  completedFocusSessionsCount: number;
  totalItemsPurchased: number;
  totalEnvironmentEquippedItems: number;
  totalPetFeedActions: number;
  walletBalance: number;
  studyStreakDays: number;
};

export type BadgeEvaluationEventType =
  | 'focus_session_completed'
  | 'shop_item_purchased'
  | 'environment_item_equipped'
  | 'pet_fed'
  | 'manual_refresh';

export type BadgeEvaluationEvent = {
  type: BadgeEvaluationEventType;
  userId: string;
};

export type BadgeEvaluationResult = {
  newlyEarned: UserBadge[];
  alreadyEarnedCount: number;
  evaluatedAt: string;
};
