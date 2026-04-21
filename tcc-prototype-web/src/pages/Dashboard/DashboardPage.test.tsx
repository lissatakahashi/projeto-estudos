import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const useAuthSessionMock = vi.fn();
const useDashboardProgressMock = vi.fn();

vi.mock('../../lib/supabase/hooks', () => ({
  useAuthSession: () => useAuthSessionMock(),
}));

vi.mock('../../hooks/useDashboardProgress', () => ({
  useDashboardProgress: (userId: string | null) => useDashboardProgressMock(userId),
}));

import DashboardPage from './DashboardPage';

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

    expect(screen.getByRole('button', { name: /Entrar na conta/i })).toBeTruthy();
  });
});
