import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PomodoroSettings } from '../../domain/pomodoro/types/PomodoroSettings';

type MockPomodoroStoreState = {
  pomodoro: {
    pomodoroId: string;
    title: string;
    mode: 'focus' | 'short_break' | 'long_break';
    status: 'idle' | 'running' | 'paused' | 'finished';
    duration: number;
    remaining: number;
    isValid: boolean;
    lostFocusSeconds: number;
    startedAt?: string;
    endedAt?: string;
  } | null;
  cycleState: {
    phase: 'idle' | 'focus' | 'short_break' | 'long_break' | 'paused' | 'completed';
    activeMode: 'focus' | 'short_break' | 'long_break';
    nextMode: 'focus' | 'short_break' | 'long_break';
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

const {
  usePomodoroStoreMock,
  setMockPomodoroStoreState,
  resetMockPomodoroStoreState,
  useWalletStoreMock,
  useAuthSessionMock,
  useDashboardProgressMock,
} = vi.hoisted(() => {
  const defaultSettings: PomodoroSettings = {
    focusDurationMinutes: 25,
    shortBreakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    cyclesBeforeLongBreak: 4,
    keepSessionRunningOnHiddenTab: false,
  };

  const createPomodoroState = (): MockPomodoroStoreState => ({
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
  });

  const basePomodoroStoreState: MockPomodoroStoreState = createPomodoroState();

  const setMockPomodoroStoreState = (next: Partial<MockPomodoroStoreState>) => {
    Object.assign(basePomodoroStoreState, next);
  };

  const resetMockPomodoroStoreState = () => {
    const initial = createPomodoroState();
    Object.assign(basePomodoroStoreState, initial);
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
    setMockPomodoroStoreState,
    resetMockPomodoroStoreState,
    useWalletStoreMock: vi.fn((selector: (state: MockWalletStoreState) => unknown) => selector(baseWalletStoreState)),
    useAuthSessionMock: vi.fn(() => null),
    useDashboardProgressMock: vi.fn((_userId: string | null) => ({ data: null, loading: false, error: null, refresh: vi.fn() })),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    unstable_usePrompt: vi.fn(),
  };
});

import PomodoroPage from './PomodoroPage';

describe('PomodoroPage - orientacoes da configuracao', () => {
  beforeEach(() => {
    resetMockPomodoroStoreState();
  });

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

  it('mantem botao de configuracao desabilitado durante sessao ativa', () => {
    setMockPomodoroStoreState({
      pomodoro: {
        pomodoroId: 'running-1',
        title: 'Foco',
        mode: 'focus',
        status: 'running',
        duration: 1500,
        remaining: 1400,
        isValid: true,
        lostFocusSeconds: 0,
        startedAt: '2026-04-16T10:00:00.000Z',
      },
      cycleState: {
        phase: 'focus',
        activeMode: 'focus',
        nextMode: 'short_break',
        remainingSeconds: 1400,
        focusSessionsCompletedInCycle: 0,
      },
    });

    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    const settingsButton = screen.getByRole('button', { name: /abrir configuracao do pomodoro/i }) as HTMLButtonElement;
    expect(settingsButton.disabled).toBe(true);
    expect(screen.getByText(/Finalize ou reinicie a sessao atual para alterar a configuracao/i)).toBeTruthy();

    fireEvent.click(settingsButton);
    expect(screen.queryByText(/Configuracao da sessao Pomodoro|Configuração da sessão Pomodoro/i)).toBeNull();
  });

  it('mantem botao de configuracao desabilitado em estado pausado', () => {
    setMockPomodoroStoreState({
      pomodoro: {
        pomodoroId: 'paused-1',
        title: 'Foco',
        mode: 'focus',
        status: 'paused',
        duration: 1500,
        remaining: 1200,
        isValid: true,
        lostFocusSeconds: 0,
        startedAt: '2026-04-16T10:00:00.000Z',
      },
      cycleState: {
        phase: 'paused',
        activeMode: 'focus',
        nextMode: 'focus',
        remainingSeconds: 1200,
        focusSessionsCompletedInCycle: 0,
      },
    });

    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    const settingsButton = screen.getByRole('button', { name: /abrir configuracao do pomodoro/i }) as HTMLButtonElement;
    expect(settingsButton.disabled).toBe(true);
  });

  it('reabilita configuracao quando nao ha ciclo em andamento', () => {
    setMockPomodoroStoreState({
      pomodoro: null,
      cycleState: {
        phase: 'completed',
        activeMode: 'focus',
        nextMode: 'focus',
        remainingSeconds: 0,
        focusSessionsCompletedInCycle: 1,
      },
    });

    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    const settingsButton = screen.getByRole('button', { name: /abrir configuracao do pomodoro/i }) as HTMLButtonElement;
    expect(settingsButton.disabled).toBe(false);

    fireEvent.click(settingsButton);
    expect(screen.getByText(/Configuracao da sessao Pomodoro|Configuração da sessão Pomodoro/i)).toBeTruthy();
  });

  it('ativa confirmacao de saida do navegador quando ha sessao em andamento', () => {
    setMockPomodoroStoreState({
      pomodoro: {
        pomodoroId: 'running-2',
        title: 'Foco',
        mode: 'focus',
        status: 'running',
        duration: 1500,
        remaining: 1000,
        isValid: true,
        lostFocusSeconds: 0,
        startedAt: '2026-04-16T10:00:00.000Z',
      },
      cycleState: {
        phase: 'focus',
        activeMode: 'focus',
        nextMode: 'short_break',
        remainingSeconds: 1000,
        focusSessionsCompletedInCycle: 0,
      },
    });

    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(beforeUnloadEvent, 'returnValue', {
      writable: true,
      value: undefined,
    });

    window.dispatchEvent(beforeUnloadEvent);

    expect(beforeUnloadEvent.defaultPrevented).toBe(true);
  });

  it('nao ativa confirmacao de saida quando nao ha sessao ativa', () => {
    render(
      <BrowserRouter>
        <PomodoroPage />
      </BrowserRouter>,
    );

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(beforeUnloadEvent);

    expect(beforeUnloadEvent.defaultPrevented).toBe(false);
  });
});
