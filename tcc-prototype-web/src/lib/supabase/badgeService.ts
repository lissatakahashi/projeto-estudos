import type { Badge, BadgeProgressSnapshot, UserBadge } from '../../domain/badges/types/badge';
import { supabase } from './client';
import type { Database } from './types';

type BadgeRow = Database['public']['Tables']['badges']['Row'];
type UserBadgeRow = Database['public']['Tables']['userBadges']['Row'];

type BadgeServiceError = {
  message: string;
  originalError?: unknown;
};

function mapBadgeRow(row: BadgeRow): Badge {
  return {
    badgeId: row.id,
    slug: row.slug as Badge['slug'],
    name: row.name,
    description: row.description,
    category: row.category as Badge['category'],
    icon: row.icon,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapUserBadgeRow(row: UserBadgeRow, badge: Badge): UserBadge {
  return {
    id: row.id,
    userId: row.userId,
    badgeId: row.badgeId,
    earnedAt: row.earnedAt,
    createdAt: row.createdAt,
    badge,
  };
}

export async function listActiveBadges(): Promise<{
  data: Badge[] | null;
  error: BadgeServiceError | null;
}> {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: true });

    if (error) {
      return { data: null, error: { message: 'Erro ao listar badges ativas.', originalError: error } };
    }

    return { data: (data ?? []).map((row) => mapBadgeRow(row as BadgeRow)), error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao listar badges ativas.', originalError } };
  }
}

export async function listUserBadges(userId: string): Promise<{
  data: UserBadge[] | null;
  error: BadgeServiceError | null;
}> {
  try {
    const [badgesResult, userBadgesResult] = await Promise.all([
      listActiveBadges(),
      supabase
        .from('userBadges')
        .select('*')
        .eq('userId', userId)
        .order('earnedAt', { ascending: false }),
    ]);

    if (badgesResult.error || !badgesResult.data) {
      return {
        data: null,
        error: { message: badgesResult.error?.message ?? 'Erro ao carregar badges para o usuario.' },
      };
    }

    if (userBadgesResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar badges conquistadas pelo usuario.', originalError: userBadgesResult.error },
      };
    }

    const badgeById = new Map(badgesResult.data.map((badge) => [badge.badgeId, badge]));
    const userBadges = (userBadgesResult.data ?? [])
      .map((row) => {
        const badge = badgeById.get((row as UserBadgeRow).badgeId);
        if (!badge) {
          return null;
        }
        return mapUserBadgeRow(row as UserBadgeRow, badge);
      })
      .filter((entry): entry is UserBadge => Boolean(entry));

    return { data: userBadges, error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar badges do usuario.', originalError } };
  }
}

export async function grantBadgesToUser(input: {
  userId: string;
  badgeIds: string[];
}): Promise<{
  data: UserBadge[] | null;
  error: BadgeServiceError | null;
}> {
  if (input.badgeIds.length === 0) {
    return { data: [], error: null };
  }

  try {
    const rowsToInsert = input.badgeIds.map((badgeId) => ({
      userId: input.userId,
      badgeId,
    }));

    const { data, error } = await supabase
      .from('userBadges')
      .upsert(rowsToInsert, { onConflict: 'userId,badgeId', ignoreDuplicates: true })
      .select('*');

    if (error) {
      return { data: null, error: { message: 'Erro ao conceder badges para o usuario.', originalError: error } };
    }

    const allUserBadgesResult = await listUserBadges(input.userId);
    if (allUserBadgesResult.error || !allUserBadgesResult.data) {
      return {
        data: null,
        error: { message: allUserBadgesResult.error?.message ?? 'Erro ao resolver badges concedidas.' },
      };
    }

    const insertedIds = new Set((data ?? []).map((row) => (row as UserBadgeRow).id));
    const grantedNow = allUserBadgesResult.data.filter((entry) => insertedIds.has(entry.id));

    return { data: grantedNow, error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao conceder badges.', originalError } };
  }
}

export async function getBadgeProgressSnapshot(userId: string): Promise<{
  data: BadgeProgressSnapshot | null;
  error: BadgeServiceError | null;
}> {
  try {
    const [sessionsResult, inventoryResult, environmentResult, walletResult, petFeedTxResult] = await Promise.all([
      supabase
        .from('pomodoroSessions')
        .select('sessionId', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('phaseType', 'focus')
        .eq('status', 'completed'),
      supabase
        .from('userInventory')
        .select('inventoryEntryId', { count: 'exact', head: true })
        .eq('userId', userId),
      supabase
        .from('userEnvironmentSlots')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId),
      supabase
        .from('wallets')
        .select('balance')
        .eq('userId', userId)
        .maybeSingle(),
      supabase
        .from('walletTransactions')
        .select('transactionId', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('reason', 'pet_fed'),
    ]);

    if (sessionsResult.error || inventoryResult.error || environmentResult.error || walletResult.error || petFeedTxResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao consultar dados de progresso para badges.' },
      };
    }

    return {
      data: {
        completedFocusSessionsCount: sessionsResult.count ?? 0,
        totalItemsPurchased: inventoryResult.count ?? 0,
        totalEnvironmentEquippedItems: environmentResult.count ?? 0,
        totalPetFeedActions: petFeedTxResult.count ?? 0,
        walletBalance: walletResult.data?.balance ?? 0,
        studyStreakDays: 0,
      },
      error: null,
    };
  } catch (originalError) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao consultar snapshot de badges.', originalError },
    };
  }
}
