import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { PomodoroSettings } from '../../domain/pomodoro/types/PomodoroSettings';

const defaultSettings: PomodoroSettings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

type MockPomodoroStoreState = {
  pomodoro: null;
  cycleState: {
    phase: 'idle';
    activeMode: 'focus';
    nextMode: 'focus';
    remainingSeconds: number;
    focusSessionsCompletedInCycle: number;
  };
  settings: PomodoroSettings;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  settingsSuccessMessage: string | null;
  completedFocusSessionsCount: number;
  totalFocusStudySeconds: number;
  startError: string | null;
  startPomodoro: () => Promise<boolean>;
  pausePomodoro: () => Promise<void>;
  resumePomodoro: () => Promise<void>;
  tickPomodoro: () => void;
  resetPomodoro: () => Promise<void>;
  advanceToNextPhase: () => Promise<void>;
  penalizeLostFocus: (_seconds: number) => void;
  loadFromStorage: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: (_settings: PomodoroSettings) => Promise<boolean>;
  clearSettingsFeedback: () => void;
  clearStartError: () => void;
  clearExpiredSession: () => void;
  invalidateActivePomodoro: (_reason: string) => Promise<void>;
};

type MockWalletStoreState = {
  balance: number;
  loading: boolean;
  transactions: Array<{ transactionType: 'credit' | 'debit'; amount: number; reason: string }>;
};

const { usePomodoroStoreMock, useWalletStoreMock, useAuthSessionMock, useDashboardProgressMock } = vi.hoisted(() => {
  const basePomodoroStoreState: MockPomodoroStoreState = {
    pomodoro: null,
    cycleState: {
      phase: 'idle',
      activeMode: 'focus',
      nextMode: 'focus',
      remainingSeconds: defaultSettings.focusDurationMinutes * 60,
      focusSessionsCompletedInCycle: 0,
    },
    settings: defaultSettings,
    settingsLoading: false,
    settingsSaving: false,
    settingsError: null,
    settingsSuccessMessage: null,
    completedFocusSessionsCount: 0,
    totalFocusStudySeconds: 0,
    startError: null,
    startPomodoro: vi.fn().mockResolvedValue(true),
    pausePomodoro: vi.fn().mockResolvedValue(undefined),
    resumePomodoro: vi.fn().mockResolvedValue(undefined),
    tickPomodoro: vi.fn(),
    resetPomodoro: vi.fn().mockResolvedValue(undefined),
    advanceToNextPhase: vi.fn().mockResolvedValue(undefined),
    penalizeLostFocus: vi.fn(),
    loadFromStorage: vi.fn(),
    loadSettings: vi.fn().mockResolvedValue(undefined),
    saveSettings: vi.fn().mockResolvedValue(true),
    clearSettingsFeedback: vi.fn(),
    clearStartError: vi.fn(),
    clearExpiredSession: vi.fn(),
    invalidateActivePomodoro: vi.fn().mockResolvedValue(undefined),
  };

  const usePomodoroStoreMockFn = vi.fn((selector: (state: MockPomodoroStoreState) => unknown) => selector(basePomodoroStoreState));
  (usePomodoroStoreMockFn as unknown as { getState: () => MockPomodoroStoreState }).getState = () => basePomodoroStoreState;

  const baseWalletStoreState: MockWalletStoreState = {
    balance: 0,
    loading: false,
    transactions: [],
  };

  return {
    usePomodoroStoreMock: usePomodoroStoreMockFn,
    useWalletStoreMock: vi.fn((selector: (state: MockWalletStoreState) => unknown) => selector(baseWalletStoreState)),
    useAuthSessionMock: vi.fn(() => null),
    useDashboardProgressMock: vi.fn(() => ({ data: null, loading: false, error: null, refresh: vi.fn() })),
  };
});

vi.mock('../../state/usePomodoroStore', () => ({
  usePomodoroStore: usePomodoroStoreMock,
}));

vi.mock('../../state/useWalletStore', () => ({
  useWalletStore: (selector: (state: MockWalletStoreState) => unknown) => useWalletStoreMock(selector),
}));

vi.mock('../../lib/supabase/hooks', () => ({
  useAuthSession: () => useAuthSessionMock(),
}));

vi.mock('../../hooks/useDashboardProgress', () => ({
  useDashboardProgress: (userId: string | null) => useDashboardProgressMock(userId),
}));

import PomodoroPage from './PomodoroPage';

describe('PomodoroPage - orientacoes da configuracao', () => {
  it('mostra bloco introdutorio e explicacoes dos campos no dialogo de configuracao', () => {
    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /configurar sessao|configurar sessão/i }));

    expect(screen.getByText(/Configure como suas sessoes de estudo e pausas vao funcionar/i)).toBeTruthy();
    expect(screen.getByText(/Essas definicoes controlam o tempo de foco/i)).toBeTruthy();

    expect(screen.getByText(/Tempo em que voce permanece concentrado na atividade/i)).toBeTruthy();
    expect(screen.getByText(/Intervalo breve entre as sessoes de foco/i)).toBeTruthy();
    expect(screen.getByText(/Intervalo maior para descanso mais completo/i)).toBeTruthy();
    expect(screen.getByText(/Quantidade de sessoes de foco concluidas/i)).toBeTruthy();

    expect(screen.getByText(/Valor recomendado entre 5 e 120 minutos/i)).toBeTruthy();
    expect(screen.getByText(/Valor recomendado entre 1 e 30 minutos/i)).toBeTruthy();
    expect(screen.getByText(/Valor recomendado entre 5 e 60 minutos/i)).toBeTruthy();
    expect(screen.getByText(/Valor recomendado entre 1 e 12 ciclos/i)).toBeTruthy();
  });
});
