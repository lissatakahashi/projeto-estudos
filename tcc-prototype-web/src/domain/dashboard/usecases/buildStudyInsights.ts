import type { DashboardRecentSession } from '../types/dashboard';
import type { StudyInsightsPayload, StudyRecommendation, UserStudyStats } from '../types/studyInsights';

type WalletTransactionLite = {
  amount: number;
  transactionType: string;
  reason: string;
};

type BuildUserStudyStatsInput = {
  sessions: DashboardRecentSession[];
  walletTransactions: WalletTransactionLite[];
  totalItemsPurchased: number;
  currentWalletBalance: number;
  now?: Date;
};

const LAST_7_DAYS_WINDOW = 7;

function toRounded(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function toPercentage(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return toRounded((part / total) * 100, 1);
}

function isInLastDays(dateIso: string, days: number, now: Date): boolean {
  const targetDate = new Date(dateIso);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const threshold = new Date(now);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));

  return targetDate.getTime() >= threshold.getTime();
}

function getMostFrequentStudyHour(sessions: DashboardRecentSession[]): number | null {
  const hoursCount = new Map<number, number>();

  sessions.forEach((session) => {
    const referenceDate = session.completedAt ?? session.endedAt;
    const hour = new Date(referenceDate).getHours();

    if (Number.isNaN(hour)) {
      return;
    }

    hoursCount.set(hour, (hoursCount.get(hour) ?? 0) + 1);
  });

  if (hoursCount.size === 0) {
    return null;
  }

  let selectedHour: number | null = null;
  let selectedCount = -1;

  for (const [hour, count] of hoursCount.entries()) {
    if (count > selectedCount || (count === selectedCount && selectedHour !== null && hour < selectedHour)) {
      selectedHour = hour;
      selectedCount = count;
    }
  }

  return selectedHour;
}

export function buildUserStudyStats(input: BuildUserStudyStatsInput): UserStudyStats {
  const completedSessions = input.sessions.filter((session) => session.status === 'completed');
  const invalidatedSessions = input.sessions.filter((session) => session.status === 'invalidated');
  const interruptedSessions = input.sessions.filter((session) => session.status === 'interrupted');

  const totalFocusTimeSeconds = completedSessions.reduce((sum, session) => sum + session.actualDurationSeconds, 0);
  const totalFocusTimeMinutes = Math.floor(totalFocusTimeSeconds / 60);
  const completedSessionsLast7Days = completedSessions.filter((session) => {
    const date = session.completedAt ?? session.endedAt;
    return isInLastDays(date, LAST_7_DAYS_WINDOW, input.now ?? new Date());
  }).length;

  const coinsEarnedFromFocusSessions = input.walletTransactions
    .filter((transaction) => transaction.transactionType === 'credit' && transaction.reason === 'focus_session_completed')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalTrackedSessions: input.sessions.length,
    totalCompletedSessions: completedSessions.length,
    totalInvalidatedSessions: invalidatedSessions.length,
    totalInterruptedSessions: interruptedSessions.length,
    totalFocusTimeMinutes,
    averageFocusMinutesPerCompletedSession: completedSessions.length > 0
      ? toRounded(totalFocusTimeMinutes / completedSessions.length, 1)
      : 0,
    completedSessionsLast7Days,
    averageCompletedSessionsPerDayLast7Days: toRounded(completedSessionsLast7Days / LAST_7_DAYS_WINDOW, 2),
    completionRatePercent: toPercentage(completedSessions.length, input.sessions.length),
    invalidationRatePercent: toPercentage(invalidatedSessions.length, input.sessions.length),
    mostFrequentStudyHour: getMostFrequentStudyHour(completedSessions),
    coinsEarnedFromFocusSessions,
    totalItemsPurchased: input.totalItemsPurchased,
    currentWalletBalance: input.currentWalletBalance,
  };
}

export function buildStudyRecommendations(stats: UserStudyStats): StudyRecommendation[] {
  if (stats.totalTrackedSessions === 0) {
    return [
      {
        id: 'start-history',
        priority: 'high',
        message: 'Você ainda não tem sessões registradas. Conclua uma sessão hoje para iniciar seu histórico.',
        evidence: 'Sem sessões de foco registradas até o momento.',
      },
    ];
  }

  const recommendations: StudyRecommendation[] = [];

  if (stats.completedSessionsLast7Days <= 1) {
    recommendations.push({
      id: 'improve-consistency',
      priority: 'high',
      message: 'Seu ritmo recente está baixo. Tente concluir ao menos 1 sessão por dia nesta semana.',
      evidence: `${stats.completedSessionsLast7Days} sessão(ões) concluída(s) nos últimos 7 dias.`,
    });
  }

  if (stats.invalidationRatePercent >= 35 && stats.totalTrackedSessions >= 3) {
    recommendations.push({
      id: 'reduce-session-size',
      priority: 'high',
      message: 'Você tem interrompido muitas sessões. Comece com blocos menores para ganhar consistência.',
      evidence: `Taxa de invalidação em ${stats.invalidationRatePercent}% das sessões.`,
    });
  }

  if (stats.completionRatePercent >= 80 && stats.totalCompletedSessions >= 4) {
    recommendations.push({
      id: 'maintain-performance',
      priority: 'positive',
      message: 'Seu desempenho está consistente. Continue no mesmo ritmo para acumular progresso.',
      evidence: `Taxa de conclusão de ${stats.completionRatePercent}% em ${stats.totalTrackedSessions} sessões.`,
    });
  }

  if (stats.averageCompletedSessionsPerDayLast7Days > 0 && stats.averageCompletedSessionsPerDayLast7Days < 0.5) {
    recommendations.push({
      id: 'increase-regularity',
      priority: 'medium',
      message: 'Sua frequência está espaçada. Defina horários fixos para reduzir pausas longas entre estudos.',
      evidence: `Média de ${stats.averageCompletedSessionsPerDayLast7Days} sessão(ões) por dia na última semana.`,
    });
  }

  if (stats.currentWalletBalance <= 0) {
    recommendations.push({
      id: 'earn-more-coins',
      priority: 'medium',
      message: 'Seu saldo está zerado. Conclua sessões de foco para ganhar moedas e liberar novas compras.',
      evidence: `Saldo atual: ${stats.currentWalletBalance} moeda(s).`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'keep-going',
      priority: 'positive',
      message: 'Seu uso está equilibrado. Continue mantendo constância nas próximas sessões.',
      evidence: `Conclusão em ${stats.completionRatePercent}% e ${stats.completedSessionsLast7Days} sessão(ões) nos últimos 7 dias.`,
    });
  }

  return recommendations.slice(0, 3);
}

export function buildStudyInsightsPayload(input: BuildUserStudyStatsInput): StudyInsightsPayload {
  const stats = buildUserStudyStats(input);

  return {
    stats,
    recommendations: buildStudyRecommendations(stats),
    isEmpty: stats.totalTrackedSessions === 0,
  };
}