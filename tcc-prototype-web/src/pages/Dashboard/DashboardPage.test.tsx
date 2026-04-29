import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthSessionMock = vi.fn();
const useDashboardProgressMock = vi.fn();

vi.mock('../../lib/supabase/hooks', () => ({
  useAuthSession: () => useAuthSessionMock(),
}));

vi.mock('../../hooks/useDashboardProgress', () => ({
  useDashboardProgress: (userId: string | null) => useDashboardProgressMock(userId),
}));

import DashboardPage from './DashboardPage';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useAuthSessionMock.mockReset();
  useDashboardProgressMock.mockReset();
});

describe('DashboardPage', () => {
  it('shows empty state guidance when user has no data yet', () => {
    useAuthSessionMock.mockReturnValue({ user: { id: 'user-1' } });
    useDashboardProgressMock.mockReturnValue({
      data: {
        metrics: {
          completedFocusSessionsCount: 0,
          totalFocusTimeSeconds: 0,
          totalFocusTimeMinutes: 0,
          currentWalletBalance: 0,
          totalCoinsEarned: 0,
          totalItemsPurchased: 0,
          recentStudyStreakDays: 0,
          lastCompletedSessionAt: null,
        },
        studyInsights: {
          stats: {
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
          },
          recommendations: [
            {
              id: 'start-history',
              priority: 'high',
              message: 'Você ainda não tem sessões registradas. Conclua uma sessão hoje para iniciar seu histórico.',
              evidence: 'Sem sessões de foco registradas até o momento.',
            },
          ],
          isEmpty: true,
        },
        recentSessions: [],
        recentActivities: [],
        recentProgress: [
          { date: '2026-03-24', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-25', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-26', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-27', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-28', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-29', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-30', completedSessions: 0, focusTimeMinutes: 0 },
        ],
        currentCycleProgress: null,
        isEmpty: true,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Painel de progresso/i })).toBeTruthy();
    expect(screen.getByText(/Complete sua primeira sessão para começar a acompanhar seu progresso/i)).toBeTruthy();
    expect(screen.getByText(/Assim que você concluir suas primeiras sessões/i)).toBeTruthy();
    expect(screen.getByText('0 moedas')).toBeTruthy();
  });

  it('shows login CTA when user is not authenticated', () => {
    useAuthSessionMock.mockReturnValue(null);
    useDashboardProgressMock.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('link', { name: /Entrar na conta/i })).toBeTruthy();
  });

  it('renders recommendation insights when user already has history', () => {
    useAuthSessionMock.mockReturnValue({ user: { id: 'user-1' } });
    useDashboardProgressMock.mockReturnValue({
      data: {
        metrics: {
          completedFocusSessionsCount: 6,
          totalFocusTimeSeconds: 7200,
          totalFocusTimeMinutes: 120,
          currentWalletBalance: 0,
          totalCoinsEarned: 24,
          totalItemsPurchased: 2,
          recentStudyStreakDays: 2,
          lastCompletedSessionAt: '2026-03-30T18:00:00.000Z',
        },
        studyInsights: {
          stats: {
            totalTrackedSessions: 8,
            totalCompletedSessions: 6,
            totalInvalidatedSessions: 2,
            totalInterruptedSessions: 0,
            totalFocusTimeMinutes: 120,
            averageFocusMinutesPerCompletedSession: 20,
            completedSessionsLast7Days: 3,
            averageCompletedSessionsPerDayLast7Days: 0.43,
            completionRatePercent: 75,
            invalidationRatePercent: 25,
            mostFrequentStudyHour: 18,
            coinsEarnedFromFocusSessions: 24,
            totalItemsPurchased: 2,
            currentWalletBalance: 0,
          },
          recommendations: [
            {
              id: 'earn-more-coins',
              priority: 'medium',
              message: 'Seu saldo está zerado. Conclua sessões de foco para ganhar moedas e liberar novas compras.',
              evidence: 'Saldo atual: 0 moeda(s).',
            },
          ],
          isEmpty: false,
        },
        recentSessions: [],
        recentActivities: [],
        recentProgress: [
          { date: '2026-03-24', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-25', completedSessions: 1, focusTimeMinutes: 25 },
          { date: '2026-03-26', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-27', completedSessions: 1, focusTimeMinutes: 20 },
          { date: '2026-03-28', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-29', completedSessions: 0, focusTimeMinutes: 0 },
          { date: '2026-03-30', completedSessions: 1, focusTimeMinutes: 25 },
        ],
        currentCycleProgress: null,
        isEmpty: false,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Insights de estudo/i })).toBeTruthy();
    expect(screen.getByText(/Seu saldo está zerado\. Conclua sessões de foco para ganhar moedas/i)).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
  });
});
