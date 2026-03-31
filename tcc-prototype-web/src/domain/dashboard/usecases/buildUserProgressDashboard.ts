import type { DashboardRawData } from '../../../lib/supabase/dashboardService';
import type {
    DashboardPayload,
    DashboardRecentActivity,
    DashboardRecentProgressPoint,
    DashboardRecentSession,
    DashboardSessionStatus,
} from '../types/dashboard';

const RECENT_SESSIONS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 10;
const RECENT_DAYS = 7;

function toSessionStatus(value: string): DashboardSessionStatus {
  if (value === 'completed' || value === 'invalidated') {
    return value;
  }

  return 'interrupted';
}

function getDateKey(input: string): string {
  return input.slice(0, 10);
}

function getRecentDateKeys(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function computeStudyStreakDays(completedSessions: DashboardRecentSession[]): number {
  if (completedSessions.length === 0) {
    return 0;
  }

  const sessionDays = new Set(
    completedSessions
      .map((session) => session.completedAt ?? session.endedAt)
      .filter(Boolean)
      .map((value) => getDateKey(String(value))),
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!sessionDays.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildRecentProgress(completedSessions: DashboardRecentSession[]): DashboardRecentProgressPoint[] {
  const dateKeys = getRecentDateKeys(RECENT_DAYS);

  return dateKeys.map((dateKey) => {
    const sessionsOfDay = completedSessions.filter((session) => {
      const sessionDate = getDateKey(session.completedAt ?? session.endedAt);
      return sessionDate === dateKey;
    });

    const focusTimeMinutes = Math.floor(
      sessionsOfDay.reduce((sum, session) => sum + session.actualDurationSeconds, 0) / 60,
    );

    return {
      date: dateKey,
      completedSessions: sessionsOfDay.length,
      focusTimeMinutes,
    };
  });
}

function mapRecentActivities(input: DashboardRawData, completedSessions: DashboardRecentSession[]): DashboardRecentActivity[] {
  const sessionRewardById = new Map(
    input.walletTransactions
      .filter((transaction) => (
        transaction.transactionType === 'credit'
        && transaction.reason === 'focus_session_completed'
        && transaction.referenceType === 'pomodoro_session'
        && Boolean(transaction.referenceId)
      ))
      .map((transaction) => [transaction.referenceId as string, transaction.amount]),
  );

  const sessionActivities: DashboardRecentActivity[] = completedSessions.map((session) => {
    const coinsEarned = sessionRewardById.get(session.sessionId) ?? 0;

    return {
      id: `session-${session.sessionId}`,
      type: 'focus_session_completed',
      title: 'Sessão de foco concluída',
      description: `${Math.floor(session.actualDurationSeconds / 60)} min de estudo válidos.`,
      createdAt: session.completedAt ?? session.endedAt,
      coinsDelta: coinsEarned,
    };
  });

  const walletActivities: DashboardRecentActivity[] = input.walletTransactions
    .filter((transaction) => transaction.reason !== 'shop_purchase' && transaction.reason !== 'focus_session_completed')
    .map((transaction) => {
      const isCredit = transaction.transactionType === 'credit';

      let type: DashboardRecentActivity['type'] = isCredit ? 'coins_earned' : 'coins_spent';
      let title = isCredit ? 'Moedas creditadas' : 'Moedas debitadas';

      if (transaction.reason === 'pet_fed') {
        type = 'pet_action';
        title = 'Interação com pet';
      } else if (transaction.reason === 'manual_adjustment' || transaction.reason === 'refund') {
        type = 'system_adjustment';
        title = 'Ajuste de saldo';
      }

      return {
        id: `wallet-${transaction.transactionId}`,
        type,
        title,
        description: transaction.description ?? `Movimentação de ${transaction.amount} moedas.`,
        createdAt: transaction.createdAt,
        coinsDelta: isCredit ? transaction.amount : -transaction.amount,
      };
    });

  const purchaseActivities: DashboardRecentActivity[] = input.inventory.map((entry) => ({
    id: `purchase-${entry.inventoryEntryId}`,
    type: 'shop_purchase',
    title: 'Item comprado na loja',
    description: `${entry.item.name} adicionado ao inventário.`,
    createdAt: entry.acquiredAt,
    coinsDelta: -entry.item.price,
  }));

  return [...sessionActivities, ...walletActivities, ...purchaseActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);
}

export function buildUserProgressDashboard(input: DashboardRawData): DashboardPayload {
  const mappedSessions: DashboardRecentSession[] = input.focusSessions.map((session) => ({
    sessionId: session.sessionId,
    status: toSessionStatus(session.status),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    completedAt: session.completedAt,
    plannedDurationSeconds: session.plannedDurationSeconds,
    actualDurationSeconds: session.actualDurationSeconds,
    focusSequenceIndex: session.focusSequenceIndex,
    cycleIndex: session.cycleIndex,
  }));

  const completedSessions = mappedSessions.filter((session) => session.status === 'completed');
  const totalFocusTimeSeconds = completedSessions.reduce((sum, session) => sum + session.actualDurationSeconds, 0);
  const totalCoinsEarned = input.walletTransactions
    .filter((transaction) => transaction.transactionType === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const recentSessions = mappedSessions.slice(0, RECENT_SESSIONS_LIMIT);
  const lastCompletedSession = completedSessions[0] ?? null;
  const lastSessionWithCycle = mappedSessions.find((session) => session.focusSequenceIndex && session.cycleIndex) ?? null;

  const metrics = {
    completedFocusSessionsCount: completedSessions.length,
    totalFocusTimeSeconds,
    totalFocusTimeMinutes: Math.floor(totalFocusTimeSeconds / 60),
    currentWalletBalance: input.wallet?.balance ?? 0,
    totalCoinsEarned,
    totalItemsPurchased: input.inventory.length,
    recentStudyStreakDays: computeStudyStreakDays(completedSessions),
    lastCompletedSessionAt: lastCompletedSession?.completedAt ?? lastCompletedSession?.endedAt ?? null,
  };

  const isEmpty =
    metrics.completedFocusSessionsCount === 0
    && metrics.totalItemsPurchased === 0
    && metrics.totalCoinsEarned === 0
    && metrics.currentWalletBalance === 0;

  return {
    metrics,
    recentSessions,
    recentActivities: mapRecentActivities(input, completedSessions),
    recentProgress: buildRecentProgress(completedSessions),
    currentCycleProgress: lastSessionWithCycle
      ? {
        cycleIndex: lastSessionWithCycle.cycleIndex ?? 1,
        focusSequenceIndex: lastSessionWithCycle.focusSequenceIndex ?? 0,
      }
      : null,
    isEmpty,
  };
}
