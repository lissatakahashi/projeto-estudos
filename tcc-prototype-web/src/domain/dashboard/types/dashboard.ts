export type DashboardSessionStatus = 'completed' | 'invalidated' | 'interrupted';

export type DashboardSummaryMetrics = {
  completedFocusSessionsCount: number;
  totalFocusTimeSeconds: number;
  totalFocusTimeMinutes: number;
  currentWalletBalance: number;
  totalCoinsEarned: number;
  totalItemsPurchased: number;
  recentStudyStreakDays: number;
  lastCompletedSessionAt: string | null;
};

export type DashboardRecentSession = {
  sessionId: string;
  status: DashboardSessionStatus;
  startedAt: string;
  endedAt: string;
  completedAt: string | null;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  focusSequenceIndex: number | null;
  cycleIndex: number | null;
};

export type DashboardRecentActivityType =
  | 'focus_session_completed'
  | 'coins_earned'
  | 'coins_spent'
  | 'shop_purchase'
  | 'pet_action'
  | 'system_adjustment';

export type DashboardRecentActivity = {
  id: string;
  type: DashboardRecentActivityType;
  title: string;
  description: string;
  createdAt: string;
  coinsDelta: number;
};

export type DashboardRecentProgressPoint = {
  date: string;
  completedSessions: number;
  focusTimeMinutes: number;
};

export type DashboardCycleProgress = {
  cycleIndex: number;
  focusSequenceIndex: number;
};

export type DashboardPayload = {
  metrics: DashboardSummaryMetrics;
  recentSessions: DashboardRecentSession[];
  recentActivities: DashboardRecentActivity[];
  recentProgress: DashboardRecentProgressPoint[];
  currentCycleProgress: DashboardCycleProgress | null;
  isEmpty: boolean;
};
