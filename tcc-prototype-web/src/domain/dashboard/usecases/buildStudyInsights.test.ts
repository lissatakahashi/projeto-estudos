import { describe, expect, it } from 'vitest';
import type { DashboardRecentSession } from '../types/dashboard';
import { buildStudyRecommendations, buildUserStudyStats } from './buildStudyInsights';

function makeSession(overrides: Partial<DashboardRecentSession> = {}): DashboardRecentSession {
  return {
    sessionId: 'session-1',
    status: 'completed',
    startedAt: '2026-03-30T17:00:00.000Z',
    endedAt: '2026-03-30T17:25:00.000Z',
    completedAt: '2026-03-30T17:25:00.000Z',
    plannedDurationSeconds: 1500,
    actualDurationSeconds: 1500,
    focusSequenceIndex: 1,
    cycleIndex: 1,
    ...overrides,
  };
}

describe('buildUserStudyStats', () => {
  it('aggregates core metrics from completed and invalidated sessions', () => {
    const stats = buildUserStudyStats({
      sessions: [
        makeSession({ sessionId: 'session-1', status: 'completed', actualDurationSeconds: 1500, completedAt: '2026-03-30T17:25:00.000Z' }),
        makeSession({ sessionId: 'session-2', status: 'completed', actualDurationSeconds: 1200, completedAt: '2026-03-29T17:20:00.000Z' }),
        makeSession({ sessionId: 'session-3', status: 'invalidated', actualDurationSeconds: 600, completedAt: null, endedAt: '2026-03-29T18:10:00.000Z' }),
        makeSession({ sessionId: 'session-4', status: 'interrupted', actualDurationSeconds: 300, completedAt: null, endedAt: '2026-03-28T18:05:00.000Z' }),
      ],
      walletTransactions: [
        { amount: 12, transactionType: 'credit', reason: 'focus_session_completed' },
        { amount: 5, transactionType: 'debit', reason: 'pet_fed' },
      ],
      totalItemsPurchased: 2,
      currentWalletBalance: 7,
      now: new Date('2026-03-30T20:00:00.000Z'),
    });

    expect(stats.totalTrackedSessions).toBe(4);
    expect(stats.totalCompletedSessions).toBe(2);
    expect(stats.totalInvalidatedSessions).toBe(1);
    expect(stats.totalInterruptedSessions).toBe(1);
    expect(stats.totalFocusTimeMinutes).toBe(45);
    expect(stats.averageFocusMinutesPerCompletedSession).toBe(22.5);
    expect(stats.completionRatePercent).toBe(50);
    expect(stats.invalidationRatePercent).toBe(25);
    expect(stats.completedSessionsLast7Days).toBe(2);
    expect(stats.averageCompletedSessionsPerDayLast7Days).toBe(0.29);
    expect(stats.mostFrequentStudyHour).toBe(new Date('2026-03-30T17:25:00.000Z').getHours());
    expect(stats.coinsEarnedFromFocusSessions).toBe(12);
  });
});

describe('buildStudyRecommendations', () => {
  it('returns onboarding guidance when there is no history', () => {
    const recommendations = buildStudyRecommendations({
      totalTrackedSessions: 0,
      totalCompletedSessions: 0,
      totalInvalidatedSessions: 0,
      totalInterruptedSessions: 0,
      totalFocusTimeMinutes: 0,
      averageFocusMinutesPerCompletedSession: 0,
      completedSessionsLast7Days: 0,
      averageCompletedSessionsPerDayLast7Days: 0,
      completionRatePercent: 0,
      invalidationRatePercent: 0,
      mostFrequentStudyHour: null,
      coinsEarnedFromFocusSessions: 0,
      totalItemsPurchased: 0,
      currentWalletBalance: 0,
    });

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]?.id).toBe('start-history');
  });

  it('adapts recommendation set for high invalidation and empty wallet', () => {
    const recommendations = buildStudyRecommendations({
      totalTrackedSessions: 6,
      totalCompletedSessions: 2,
      totalInvalidatedSessions: 3,
      totalInterruptedSessions: 1,
      totalFocusTimeMinutes: 35,
      averageFocusMinutesPerCompletedSession: 17.5,
      completedSessionsLast7Days: 2,
      averageCompletedSessionsPerDayLast7Days: 0.57,
      completionRatePercent: 33.3,
      invalidationRatePercent: 50,
      mostFrequentStudyHour: 21,
      coinsEarnedFromFocusSessions: 8,
      totalItemsPurchased: 0,
      currentWalletBalance: 0,
    });

    expect(recommendations.some((item) => item.id === 'reduce-session-size')).toBe(true);
    expect(recommendations.some((item) => item.id === 'earn-more-coins')).toBe(true);
    expect(recommendations.some((item) => item.id === 'improve-consistency')).toBe(false);
  });
});