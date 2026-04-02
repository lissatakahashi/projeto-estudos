import { describe, expect, it } from 'vitest';
import { evaluateBadgeEligibility } from './evaluateBadgeEligibility';

describe('evaluateBadgeEligibility', () => {
  it('returns first session badge when user completed first valid session', () => {
    const result = evaluateBadgeEligibility({
      completedFocusSessionsCount: 1,
      totalItemsPurchased: 0,
      totalEnvironmentEquippedItems: 0,
      totalPetFeedActions: 0,
      walletBalance: 0,
      studyStreakDays: 1,
    }, 'focus_session_completed');

    expect(result).toContain('first_focus_session');
    expect(result).not.toContain('four_focus_sessions');
  });

  it('returns only environment badge for environment_item_equipped event', () => {
    const result = evaluateBadgeEligibility({
      completedFocusSessionsCount: 11,
      totalItemsPurchased: 1,
      totalEnvironmentEquippedItems: 2,
      totalPetFeedActions: 1,
      walletBalance: 130,
      studyStreakDays: 3,
    }, 'environment_item_equipped');

    expect(result).toEqual(['first_environment_item_equipped']);
  });

  it('returns all expected thresholds on manual_refresh', () => {
    const result = evaluateBadgeEligibility({
      completedFocusSessionsCount: 11,
      totalItemsPurchased: 1,
      totalEnvironmentEquippedItems: 2,
      totalPetFeedActions: 1,
      walletBalance: 130,
      studyStreakDays: 3,
    }, 'manual_refresh');

    expect(result).toEqual(
      expect.arrayContaining([
        'first_focus_session',
        'four_focus_sessions',
        'ten_focus_sessions',
        'first_shop_purchase',
        'first_environment_item_equipped',
        'first_pet_feed',
        'wallet_balance_100',
      ]),
    );
  });
});
