import create from 'zustand';
import { DEFAULT_POMODORO_SETTINGS } from '../domain/pomodoro/constants/pomodoroSettings';
import { Pomodoro, PomodoroCycleState, PomodoroHistoryItem } from '../domain/pomodoro/types';
import type { PomodoroSettings } from '../domain/pomodoro/types/PomodoroSettings';
import {
    completeCurrentPhase,
    createIdlePomodoroCycleState,
    moveToNextPhase,
    pausePomodoroCycle,
    resetPomodoroCycle,
    resumePomodoroCycle,
    startPomodoroCycle,
} from '../domain/pomodoro/usecases/pomodoroCycleMachine';
import { sanitizePomodoroSettings } from '../domain/pomodoro/validation/pomodoroSettingsValidation';
import {
    createPomodoro as createPomodoroSupabase,
    listPomodoros as listPomodorosSupabase,
    mapPomodoroToRecord,
    mapRecordToPomodoro,
    updatePomodoro as updatePomodoroSupabase,
} from '../lib/supabase/pomodoroService';
import {
    getUserPomodoroSettings,
    loadPomodoroSettingsFromLocalStorage,
    savePomodoroSettingsToLocalStorage,
    upsertUserPomodoroSettings,
} from '../lib/supabase/pomodoroSettingsService';

import { supabase } from '../lib/supabase/client';

const STORAGE_KEY = 'pomodoro_state_v1';
const DEFAULT_COINS = 0;
const LOST_FOCUS_THRESHOLD = 15; // seconds to mark invalid

type PomodoroStore = {
  pomodoro: Pomodoro | null;
  cycleState: PomodoroCycleState;
  phaseEndsAtEpochMs: number | null;
  economy: { coins: number };
  history: PomodoroHistoryItem[];
  settings: PomodoroSettings;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  settingsSuccessMessage: string | null;
  startError: string | null;
  schemaVersion: number;
  userId: string | null;
  // actions
  setUserId: (id: string | null) => void;
  startPomodoro: (opts?: { duration?: number; mode?: Pomodoro['mode'] }) => Promise<boolean>;
  tickPomodoro: () => void;
  pausePomodoro: () => Promise<void>;
  resumePomodoro: () => Promise<void>;
  completePomodoro: (opts?: { resetToFocus?: boolean; autoStartNext?: boolean }) => Promise<void>;
  resetPomodoro: () => Promise<void>;
  advanceToNextPhase: () => Promise<boolean>;
  penalizeLostFocus: (seconds: number) => Promise<void>;
  addCoins: (amount: number) => void;
  loadFromStorage: () => void;
  loadHistory: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: PomodoroSettings) => Promise<boolean>;
  clearSettingsFeedback: () => void;
  clearStartError: () => void;
  clearExpiredSession: () => void;
};

function saveToStorage(state: Partial<PomodoroStore>) {
  try {
    const payload = JSON.stringify({
      pomodoro: state.pomodoro ?? null,
      cycleState: state.cycleState ?? createIdlePomodoroCycleState(state.settings ?? DEFAULT_POMODORO_SETTINGS),
      phaseEndsAtEpochMs: state.phaseEndsAtEpochMs ?? null,
      economy: state.economy ?? { coins: DEFAULT_COINS },
      history: state.history ?? [],
      settings: state.settings ?? DEFAULT_POMODORO_SETTINGS,
      schemaVersion: 1,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // ignore
  }
}

function getSessionTitle(mode: Pomodoro['mode']): string {
  if (mode === 'short_break') return 'Pausa curta';
  if (mode === 'long_break') return 'Pausa longa';
  return 'Foco';
}

function isActiveMode(mode: string): mode is Pomodoro['mode'] {
  return mode === 'focus' || mode === 'short_break' || mode === 'long_break';
}

function getRemainingFromEndsAt(phaseEndsAtEpochMs: number): number {
  const diff = Math.ceil((phaseEndsAtEpochMs - Date.now()) / 1000);
  return Math.max(0, diff);
}

function hydrateCycleState(parsed: { cycleState?: PomodoroCycleState; pomodoro?: Pomodoro | null }, settings: PomodoroSettings): PomodoroCycleState {
  if (parsed.cycleState) {
    return parsed.cycleState;
  }

  const fallback = createIdlePomodoroCycleState(settings);
  const persistedPomodoro = parsed.pomodoro;

  if (!persistedPomodoro || !isActiveMode(persistedPomodoro.mode)) {
    return fallback;
  }

  return {
    ...fallback,
    phase: persistedPomodoro.status === 'paused' ? 'paused' : persistedPomodoro.mode,
    activeMode: persistedPomodoro.mode,
    nextMode: persistedPomodoro.mode,
    phaseDurationSeconds: persistedPomodoro.duration,
    remainingSeconds: persistedPomodoro.remaining,
  };
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  pomodoro: null,
  cycleState: createIdlePomodoroCycleState(DEFAULT_POMODORO_SETTINGS),
  phaseEndsAtEpochMs: null,
  economy: { coins: DEFAULT_COINS },
  history: [],
  settings: DEFAULT_POMODORO_SETTINGS,
  settingsLoading: false,
  settingsSaving: false,
  settingsError: null,
  settingsSuccessMessage: null,
  startError: null,
  schemaVersion: 1,
  userId: null,

  setUserId: (id) => {
    set({ userId: id });
    void get().loadSettings();
    void get().loadHistory();
  },

  startPomodoro: async (opts = {}) => {
    const state = get();
    if (state.pomodoro && state.pomodoro.status !== 'finished') {
      set({ startError: 'Finalize a sessao atual antes de iniciar outra.' });
      return false;
    }

    const settings = sanitizePomodoroSettings(state.settings);
    const targetMode = opts.mode ?? 'focus';
    const startedCycle = startPomodoroCycle(state.cycleState, settings, targetMode);
    const duration = opts.duration ?? startedCycle.phaseDurationSeconds;

    if (!Number.isFinite(duration) || duration <= 0) {
      set({ startError: 'A configuracao Pomodoro esta invalida. Revise os tempos antes de iniciar.' });
      return false;
    }

    const cycleState: PomodoroCycleState = {
      ...startedCycle,
      phaseDurationSeconds: duration,
      remainingSeconds: duration,
    };
    const phaseEndsAtEpochMs = Date.now() + duration * 1000;

    const initialId = Date.now().toString();
    const p: Pomodoro = {
      pomodoroId: initialId,
      title: getSessionTitle(cycleState.activeMode),
      mode: cycleState.activeMode,
      status: 'running' as const,
      duration,
      remaining: duration,
      isValid: true,
      lostFocusSeconds: 0,
      startedAt: new Date().toISOString(),
    };

    set({
      pomodoro: p,
      settings,
      cycleState,
      phaseEndsAtEpochMs,
      startError: null,
    });
    saveToStorage({
      pomodoro: p,
      cycleState,
      phaseEndsAtEpochMs,
      economy: get().economy,
      history: get().history,
      settings,
    });

    // Sync with Supabase if logged in
    const { userId } = state;
    if (userId) {
      const record = mapPomodoroToRecord(p, userId);
      const { data, error } = await createPomodoroSupabase(record);
      if (data && !error) {
        // Update local pomodoro with the Supabase UUID
        set((state) => ({
          pomodoro: state.pomodoro ? { ...state.pomodoro, pomodoroId: data.pomodoroId } : null
        }));
      }
    }

    return true;
  },

  tickPomodoro: () => {
    const s = get();
    const p = s.pomodoro;
    if (!p || p.status !== 'running') return;

    const nextRemaining = s.phaseEndsAtEpochMs ? getRemainingFromEndsAt(s.phaseEndsAtEpochMs) : p.remaining - 1;

    if (nextRemaining <= 0) {
      void get().completePomodoro({ autoStartNext: true });
      return;
    }

    const cycleState = {
      ...s.cycleState,
      remainingSeconds: nextRemaining,
    };
    const updated = { ...p, remaining: nextRemaining };
    set({ pomodoro: updated, cycleState });
    saveToStorage({
      pomodoro: updated,
      cycleState,
      phaseEndsAtEpochMs: s.phaseEndsAtEpochMs,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
    });
  },

  pausePomodoro: async () => {
    const s = get();
    const p = s.pomodoro;
    if (!p || p.status !== 'running') return;

    const pausedCycle = pausePomodoroCycle({
      ...s.cycleState,
      remainingSeconds: p.remaining,
    });
    const updated: Pomodoro = { ...p, status: 'paused' as const };
    set({ pomodoro: updated, cycleState: pausedCycle, phaseEndsAtEpochMs: null });
    saveToStorage({
      pomodoro: updated,
      cycleState: pausedCycle,
      phaseEndsAtEpochMs: null,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
    });

    if (s.userId && p.pomodoroId.length > 20) { // Check if it's a UUID
      await updatePomodoroSupabase(p.pomodoroId, { isComplete: false });
    }
  },

  resumePomodoro: async () => {
    const s = get();
    const p = s.pomodoro;
    if (!p || p.status !== 'paused') return;

    const resumedCycle = resumePomodoroCycle(s.cycleState);
    const phaseEndsAtEpochMs = Date.now() + p.remaining * 1000;
    const updated: Pomodoro = { ...p, status: 'running' as const };
    set({ pomodoro: updated, cycleState: resumedCycle, phaseEndsAtEpochMs });
    saveToStorage({
      pomodoro: updated,
      cycleState: resumedCycle,
      phaseEndsAtEpochMs,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
    });

    if (s.userId && p.pomodoroId.length > 20) {
      await updatePomodoroSupabase(p.pomodoroId, { isComplete: false });
    }
  },

  completePomodoro: async (opts = {}) => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;

    const settings = sanitizePomodoroSettings(s.settings);
    const endedAt = new Date().toISOString();
    const historyItem: PomodoroHistoryItem = {
      pomodoroHistoryItemId: p.pomodoroId,
      mode: p.mode,
      start: p.startedAt ?? endedAt,
      end: endedAt,
      duration: p.duration,
      actualDuration: p.duration - p.remaining,
      isValid: p.isValid,
      invalidReason: p.invalidReason,
    };
    const newHistory = [historyItem, ...s.history].slice(0, 200);
    const updatedPomodoro: Pomodoro = { ...p, status: 'finished' as const, endedAt };
    const completion = completeCurrentPhase(
      {
        ...s.cycleState,
        activeMode: p.mode,
        phase: p.mode,
        remainingSeconds: 0,
      },
      settings,
    );

    let nextCycle = opts.resetToFocus ? resetPomodoroCycle(settings) : completion.state;
    let nextPomodoro: Pomodoro | null = null;
    let phaseEndsAtEpochMs: number | null = null;

    if (!opts.resetToFocus && opts.autoStartNext) {
      const runningCycle = moveToNextPhase(nextCycle, settings);
      nextCycle = runningCycle;
      const nowIso = new Date().toISOString();
      nextPomodoro = {
        pomodoroId: Date.now().toString(),
        title: getSessionTitle(runningCycle.activeMode),
        mode: runningCycle.activeMode,
        status: 'running',
        duration: runningCycle.phaseDurationSeconds,
        remaining: runningCycle.remainingSeconds,
        isValid: true,
        lostFocusSeconds: 0,
        startedAt: nowIso,
      };
      phaseEndsAtEpochMs = Date.now() + runningCycle.remainingSeconds * 1000;
    }

    set({
      pomodoro: nextPomodoro,
      history: newHistory,
      cycleState: nextCycle,
      phaseEndsAtEpochMs,
    });

    // credit coins only if valid
    if (p.isValid) {
      const coinsToAdd = 5; // configurable later
      get().addCoins(coinsToAdd);
    }
    saveToStorage({
      pomodoro: nextPomodoro,
      cycleState: nextCycle,
      phaseEndsAtEpochMs,
      economy: get().economy,
      history: newHistory,
      settings: s.settings,
    });

    // Sync with Supabase
    if (s.userId && p.pomodoroId.length > 20) {
      const recordUpdates = mapPomodoroToRecord(updatedPomodoro, s.userId);
      await updatePomodoroSupabase(p.pomodoroId, {
        isComplete: true,
        endedAt,
        metadata: recordUpdates.metadata
      });
    }

    if (nextPomodoro && s.userId) {
      const record = mapPomodoroToRecord(nextPomodoro, s.userId);
      const { data, error } = await createPomodoroSupabase(record);
      if (data && !error) {
        set((storeState) => ({
          pomodoro: storeState.pomodoro ? { ...storeState.pomodoro, pomodoroId: data.pomodoroId } : null,
        }));
      }
    }
  },

  resetPomodoro: async () => {
    const s = get();
    if (s.pomodoro) {
      await get().completePomodoro({ resetToFocus: true });
      return;
    }

    const resetState = resetPomodoroCycle(s.settings);
    set({ cycleState: resetState, phaseEndsAtEpochMs: null, pomodoro: null });
    saveToStorage({
      pomodoro: null,
      cycleState: resetState,
      phaseEndsAtEpochMs: null,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
    });
  },

  advanceToNextPhase: async () => {
    const s = get();
    if (s.pomodoro) {
      await get().completePomodoro({ autoStartNext: true });
      return true;
    }

    const started = await get().startPomodoro({ mode: s.cycleState.nextMode });
    return started;
  },

  penalizeLostFocus: async (seconds: number) => {
    const s = get();
    const p = s.pomodoro;
    if (!p || p.status !== 'running') return;
    const lost = p.lostFocusSeconds + seconds;
    const isValid = lost <= LOST_FOCUS_THRESHOLD;
    const updated: Pomodoro = { ...p, lostFocusSeconds: lost, isValid, invalidReason: isValid ? undefined : 'lost_focus' };
    set({ pomodoro: updated });
    saveToStorage({
      pomodoro: updated,
      cycleState: s.cycleState,
      phaseEndsAtEpochMs: s.phaseEndsAtEpochMs,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
    });

    if (s.userId && p.pomodoroId.length > 20) {
      const recordUpdates = mapPomodoroToRecord(updated, s.userId);
      await updatePomodoroSupabase(p.pomodoroId, {
        metadata: recordUpdates.metadata
      });
    }
  },

  addCoins: (amount: number) => {
    const s = get();
    const next = { coins: (s.economy?.coins ?? 0) + amount };
    set({ economy: next });
    saveToStorage({
      pomodoro: s.pomodoro,
      cycleState: s.cycleState,
      phaseEndsAtEpochMs: s.phaseEndsAtEpochMs,
      economy: next,
      history: s.history,
      settings: s.settings,
    });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalizedSettings = sanitizePomodoroSettings(parsed.settings);
      const hydratedCycleState = hydrateCycleState(parsed, normalizedSettings);
      set({
        pomodoro: parsed.pomodoro ?? null,
        cycleState: hydratedCycleState,
        phaseEndsAtEpochMs: parsed.phaseEndsAtEpochMs ?? null,
        economy: parsed.economy ?? { coins: DEFAULT_COINS },
        history: parsed.history ?? [],
        settings: normalizedSettings,
        schemaVersion: parsed.schemaVersion ?? 1,
      });
    } catch {
      // ignore
    }
  },

  loadHistory: async () => {
    const { userId } = get();
    if (!userId) return;

    const { data, error } = await listPomodorosSupabase(userId);
    if (!error && data) {
      // Map records to history items
      const historyItems: PomodoroHistoryItem[] = data
        .filter(r => r.isComplete)
        .map(r => {
          const p = mapRecordToPomodoro(r);
          return {
            pomodoroHistoryItemId: p.pomodoroId,
            mode: p.mode,
            start: p.startedAt!,
            end: p.endedAt!,
            duration: p.duration,
            actualDuration: p.duration, // Simplified
            isValid: p.isValid,
            invalidReason: p.invalidReason,
          };
        });

      set({ history: historyItems });
      saveToStorage({
        pomodoro: get().pomodoro,
        cycleState: get().cycleState,
        phaseEndsAtEpochMs: get().phaseEndsAtEpochMs,
        economy: get().economy,
        history: historyItems,
        settings: get().settings,
      });
    }
  },

  loadSettings: async () => {
    const { userId } = get();
    set({ settingsLoading: true, settingsError: null, settingsSuccessMessage: null });

    if (!userId) {
      const state = get();
      const localSettings = loadPomodoroSettingsFromLocalStorage();
      const normalized = sanitizePomodoroSettings(localSettings);
      const cycleState: PomodoroCycleState = !state.pomodoro && (state.cycleState.phase === 'idle' || state.cycleState.phase === 'completed')
        ? {
          ...state.cycleState,
          nextMode: 'focus' as const,
          phaseDurationSeconds: normalized.focusDurationMinutes * 60,
          remainingSeconds: normalized.focusDurationMinutes * 60,
        }
        : state.cycleState;

      set({ settings: normalized, settingsLoading: false, cycleState });
      saveToStorage({
        pomodoro: get().pomodoro,
        cycleState,
        phaseEndsAtEpochMs: get().phaseEndsAtEpochMs,
        economy: get().economy,
        history: get().history,
        settings: normalized,
      });
      return;
    }

    const { data, error } = await getUserPomodoroSettings(userId);

    if (error) {
      const localSettings = loadPomodoroSettingsFromLocalStorage();
      const normalized = sanitizePomodoroSettings(localSettings);
      set({
        settings: normalized,
        settingsLoading: false,
        settingsError: 'Nao foi possivel carregar do servidor. Usando configuracao local.',
      });
      savePomodoroSettingsToLocalStorage(normalized);
      return;
    }

    if (!data) {
      const fallback = sanitizePomodoroSettings(loadPomodoroSettingsFromLocalStorage());
      set({ settings: fallback, settingsLoading: false });
      savePomodoroSettingsToLocalStorage(fallback);
      await upsertUserPomodoroSettings(userId, fallback);
      return;
    }

    const normalized = sanitizePomodoroSettings(data);
    const state = get();
    const cycleState: PomodoroCycleState = !state.pomodoro && (state.cycleState.phase === 'idle' || state.cycleState.phase === 'completed')
      ? {
        ...state.cycleState,
        nextMode: 'focus' as const,
        phaseDurationSeconds: normalized.focusDurationMinutes * 60,
        remainingSeconds: normalized.focusDurationMinutes * 60,
      }
      : state.cycleState;

    set({ settings: normalized, settingsLoading: false, cycleState });
    savePomodoroSettingsToLocalStorage(normalized);
  },

  saveSettings: async (settings) => {
    const normalized = sanitizePomodoroSettings(settings);
    const s = get();
    const shouldRefreshCyclePreview = !s.pomodoro && (s.cycleState.phase === 'idle' || s.cycleState.phase === 'completed');
    const adjustedCycleState: PomodoroCycleState = shouldRefreshCyclePreview
      ? {
        ...s.cycleState,
        phaseDurationSeconds: normalized.focusDurationMinutes * 60,
        remainingSeconds: normalized.focusDurationMinutes * 60,
        nextMode: 'focus' as const,
      }
      : s.cycleState;

    set({
      settingsSaving: true,
      settingsError: null,
      settingsSuccessMessage: null,
      settings: normalized,
      cycleState: adjustedCycleState,
    });
    savePomodoroSettingsToLocalStorage(normalized);
    saveToStorage({
      pomodoro: s.pomodoro,
      cycleState: adjustedCycleState,
      phaseEndsAtEpochMs: s.phaseEndsAtEpochMs,
      economy: s.economy,
      history: s.history,
      settings: normalized,
    });

    if (!s.userId) {
      set({
        settingsSaving: false,
        settingsSuccessMessage:
          s.pomodoro && s.pomodoro.status !== 'finished'
            ? 'Configuracao salva. A sessao atual foi mantida e as novas duracoes valem para as proximas sessoes.'
            : 'Configuracao salva com sucesso.',
      });
      return true;
    }

    const { data, error } = await upsertUserPomodoroSettings(s.userId, normalized);

    if (error || !data) {
      set({
        settingsSaving: false,
        settingsError: 'Nao foi possivel salvar no servidor. Tente novamente.',
      });
      return false;
    }

    const persisted = sanitizePomodoroSettings(data);
    set({
      settings: persisted,
      settingsSaving: false,
      settingsSuccessMessage:
        s.pomodoro && s.pomodoro.status !== 'finished'
          ? 'Configuracao salva. A sessao atual foi mantida e as novas duracoes valem para as proximas sessoes.'
          : 'Configuracao salva com sucesso.',
    });

    savePomodoroSettingsToLocalStorage(persisted);
    return true;
  },

  clearSettingsFeedback: () => {
    set({ settingsError: null, settingsSuccessMessage: null });
  },

  clearStartError: () => {
    set({ startError: null });
  },

  clearExpiredSession: () => {
    const s = get();
    const p = s.pomodoro;
    if (!p || !p.startedAt) return;
    const started = new Date(p.startedAt).getTime();
    const now = Date.now();
    const maxResumeMs = 1000 * 60 * 60 * 24; // 24h
    if (now - started > maxResumeMs) {
      const resetState = resetPomodoroCycle(s.settings);
      set({ pomodoro: null, cycleState: resetState, phaseEndsAtEpochMs: null });
      saveToStorage({
        pomodoro: null,
        cycleState: resetState,
        phaseEndsAtEpochMs: null,
        economy: s.economy,
        history: s.history,
        settings: s.settings,
      });
    }
  },
}));

// Listen for Auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  usePomodoroStore.getState().setUserId(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  usePomodoroStore.getState().setUserId(data.session?.user?.id ?? null);
});

// try to initialize from storage
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const normalizedSettings = sanitizePomodoroSettings(parsed.settings);
    const hydratedCycleState = hydrateCycleState(parsed, normalizedSettings);
    usePomodoroStore.setState({
      pomodoro: parsed.pomodoro ?? null,
      cycleState: hydratedCycleState,
      phaseEndsAtEpochMs: parsed.phaseEndsAtEpochMs ?? null,
      economy: parsed.economy ?? { coins: DEFAULT_COINS },
      history: parsed.history ?? [],
      settings: normalizedSettings,
      schemaVersion: parsed.schemaVersion ?? 1,
    });
  }
} catch {
  // ignore
}
