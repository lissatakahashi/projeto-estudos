export type UserStudyStats = {
  totalTrackedSessions: number;
  totalCompletedSessions: number;
  totalInvalidatedSessions: number;
  totalInterruptedSessions: number;
  totalFocusTimeMinutes: number;
  averageFocusMinutesPerCompletedSession: number;
  completedSessionsLast7Days: number;
  averageCompletedSessionsPerDayLast7Days: number;
  completionRatePercent: number;
  invalidationRatePercent: number;
  mostFrequentStudyHour: number | null;
  coinsEarnedFromFocusSessions: number;
  totalItemsPurchased: number;
  currentWalletBalance: number;
};

export type StudyRecommendationPriority = 'high' | 'medium' | 'positive';

export type StudyRecommendation = {
  id: string;
  priority: StudyRecommendationPriority;
  message: string;
  evidence: string;
};

export type StudyInsightsPayload = {
  stats: UserStudyStats;
  recommendations: StudyRecommendation[];
  isEmpty: boolean;
};