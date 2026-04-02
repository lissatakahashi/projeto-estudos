import type {
    BadgeEvaluationEventType,
    BadgeProgressSnapshot,
    SystemBadgeSlug,
} from '../types/badge';

function isSlugAllowedForEvent(slug: SystemBadgeSlug, eventType: BadgeEvaluationEventType): boolean {
  switch (eventType) {
    case 'focus_session_completed':
      return (
        slug === 'first_focus_session'
        || slug === 'four_focus_sessions'
        || slug === 'ten_focus_sessions'
        || slug === 'wallet_balance_100'
      );
    case 'shop_item_purchased':
      return slug === 'first_shop_purchase';
    case 'environment_item_equipped':
      return slug === 'first_environment_item_equipped';
    case 'pet_fed':
      return slug === 'first_pet_feed';
    case 'manual_refresh':
      return true;
    default:
      return false;
  }
}

export function evaluateBadgeEligibility(
  progress: BadgeProgressSnapshot,
  eventType: BadgeEvaluationEventType,
): SystemBadgeSlug[] {
  const eligible = new Set<SystemBadgeSlug>();

  if (progress.completedFocusSessionsCount >= 1) {
    eligible.add('first_focus_session');
  }

  if (progress.completedFocusSessionsCount >= 4) {
    eligible.add('four_focus_sessions');
  }

  if (progress.completedFocusSessionsCount >= 10) {
    eligible.add('ten_focus_sessions');
  }

  if (progress.totalItemsPurchased >= 1) {
    eligible.add('first_shop_purchase');
  }

  if (progress.totalEnvironmentEquippedItems >= 1) {
    eligible.add('first_environment_item_equipped');
  }

  if (progress.totalPetFeedActions >= 1) {
    eligible.add('first_pet_feed');
  }

  if (progress.walletBalance >= 100) {
    eligible.add('wallet_balance_100');
  }

  return Array.from(eligible).filter((slug) => isSlugAllowedForEvent(slug, eventType));
}
