import { describe, expect, it, vi } from 'vitest';
import type { Badge } from '../types/badge';
import { evaluateAndGrantUserBadges } from './evaluateAndGrantUserBadges';

const catalog: Badge[] = [
  {
    badgeId: 'badge-1',
    slug: 'first_focus_session',
    name: 'Primeiro Foco',
    description: 'Conclua sua primeira sessao.',
    category: 'study',
    icon: 'timer',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('evaluateAndGrantUserBadges', () => {
  it('grants first focus badge for focus_session_completed event', async () => {
    const deps = {
      listActiveBadges: vi.fn().mockResolvedValue({ data: catalog, error: null }),
      getBadgeProgressSnapshot: vi.fn().mockResolvedValue({
        data: {
          completedFocusSessionsCount: 1,
          totalItemsPurchased: 0,
          totalEnvironmentEquippedItems: 0,
          totalPetFeedActions: 0,
          walletBalance: 0,
          studyStreakDays: 1,
        },
        error: null,
      }),
      listUserBadges: vi.fn().mockResolvedValue({ data: [], error: null }),
      grantBadgesToUser: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'user-badge-1',
            userId: 'user-1',
            badgeId: 'badge-1',
            earnedAt: '2026-04-01T00:00:00.000Z',
            createdAt: '2026-04-01T00:00:00.000Z',
            badge: catalog[0],
          },
        ],
        error: null,
      }),
    };

    const result = await evaluateAndGrantUserBadges(deps, {
      type: 'focus_session_completed',
      userId: 'user-1',
    });

    expect(result.error).toBeNull();
    expect(result.data?.newlyEarned).toHaveLength(1);
    expect(deps.grantBadgesToUser).toHaveBeenCalledWith({ userId: 'user-1', badgeIds: ['badge-1'] });
  });

  it('does not grant duplicate badge when user already has it', async () => {
    const deps = {
      listActiveBadges: vi.fn().mockResolvedValue({ data: catalog, error: null }),
      getBadgeProgressSnapshot: vi.fn().mockResolvedValue({
        data: {
          completedFocusSessionsCount: 3,
          totalItemsPurchased: 0,
          totalEnvironmentEquippedItems: 0,
          totalPetFeedActions: 0,
          walletBalance: 0,
          studyStreakDays: 2,
        },
        error: null,
      }),
      listUserBadges: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'user-badge-1',
            userId: 'user-1',
            badgeId: 'badge-1',
            earnedAt: '2026-04-01T00:00:00.000Z',
            createdAt: '2026-04-01T00:00:00.000Z',
            badge: catalog[0],
          },
        ],
        error: null,
      }),
      grantBadgesToUser: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const result = await evaluateAndGrantUserBadges(deps, {
      type: 'focus_session_completed',
      userId: 'user-1',
    });

    expect(result.error).toBeNull();
    expect(result.data?.newlyEarned).toEqual([]);
    expect(deps.grantBadgesToUser).not.toHaveBeenCalled();
  });
});
