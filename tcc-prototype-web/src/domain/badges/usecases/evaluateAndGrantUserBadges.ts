import type {
    Badge,
    BadgeEvaluationEvent,
    BadgeEvaluationResult,
    BadgeProgressSnapshot,
    UserBadge,
} from '../types/badge';
import { evaluateBadgeEligibility } from './evaluateBadgeEligibility';

export type EvaluateAndGrantUserBadgesDeps = {
  listActiveBadges: () => Promise<{ data: Badge[] | null; error: { message: string } | null }>;
  getBadgeProgressSnapshot: (userId: string) => Promise<{ data: BadgeProgressSnapshot | null; error: { message: string } | null }>;
  listUserBadges: (userId: string) => Promise<{ data: UserBadge[] | null; error: { message: string } | null }>;
  grantBadgesToUser: (input: { userId: string; badgeIds: string[] }) => Promise<{ data: UserBadge[] | null; error: { message: string } | null }>;
};

const EMPTY_RESULT: BadgeEvaluationResult = {
  newlyEarned: [],
  alreadyEarnedCount: 0,
  evaluatedAt: new Date(0).toISOString(),
};

export async function evaluateAndGrantUserBadges(
  deps: EvaluateAndGrantUserBadgesDeps,
  event: BadgeEvaluationEvent,
): Promise<{ data: BadgeEvaluationResult | null; error: { message: string } | null }> {
  if (!event.userId) {
    return {
      data: null,
      error: { message: 'Usuario nao autenticado para avaliacao de badges.' },
    };
  }

  const [badgesResult, progressResult, userBadgesResult] = await Promise.all([
    deps.listActiveBadges(),
    deps.getBadgeProgressSnapshot(event.userId),
    deps.listUserBadges(event.userId),
  ]);

  if (badgesResult.error || !badgesResult.data) {
    return { data: null, error: { message: badgesResult.error?.message ?? 'Erro ao carregar badges ativas.' } };
  }

  if (progressResult.error || !progressResult.data) {
    return { data: null, error: { message: progressResult.error?.message ?? 'Erro ao carregar progresso para badges.' } };
  }

  if (userBadgesResult.error || !userBadgesResult.data) {
    return { data: null, error: { message: userBadgesResult.error?.message ?? 'Erro ao carregar badges do usuario.' } };
  }

  const eligibleSlugs = evaluateBadgeEligibility(progressResult.data, event.type);
  const badgeBySlug = new Map(badgesResult.data.map((badge) => [badge.slug, badge]));
  const ownedBadgeIds = new Set(userBadgesResult.data.map((entry) => entry.badgeId));

  const candidateBadgeIds = eligibleSlugs
    .map((slug) => badgeBySlug.get(slug)?.badgeId)
    .filter((badgeId): badgeId is string => Boolean(badgeId))
    .filter((badgeId) => !ownedBadgeIds.has(badgeId));

  if (candidateBadgeIds.length === 0) {
    return {
      data: {
        ...EMPTY_RESULT,
        alreadyEarnedCount: userBadgesResult.data.length,
        evaluatedAt: new Date().toISOString(),
      },
      error: null,
    };
  }

  const grantResult = await deps.grantBadgesToUser({
    userId: event.userId,
    badgeIds: candidateBadgeIds,
  });

  if (grantResult.error || !grantResult.data) {
    return { data: null, error: { message: grantResult.error?.message ?? 'Erro ao conceder badges.' } };
  }

  return {
    data: {
      newlyEarned: grantResult.data,
      alreadyEarnedCount: userBadgesResult.data.length,
      evaluatedAt: new Date().toISOString(),
    },
    error: null,
  };
}
