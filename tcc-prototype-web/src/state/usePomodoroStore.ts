import create from 'zustand';
import { DEFAULT_POMODORO_SETTINGS } from '../domain/pomodoro/constants/pomodoroSettings';
import { Pomodoro, PomodoroHistoryItem } from '../domain/pomodoro/types';
import type { PomodoroSettings } from '../domain/pomodoro/types/PomodoroSettings';
import {
    DEFAULT_SESSION_PLANNING_STATE,
    getNextModeAfterCompletion,
    resolveModeDurationSeconds,
} from '../domain/pomodoro/usecases/pomodoroSessionPlanner';
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
  economy: { coins: number };
  history: PomodoroHistoryItem[];
  settings: PomodoroSettings;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  settingsSuccessMessage: string | null;
  startError: string | null;
  nextMode: Pomodoro['mode'];
  focusSessionsCompletedInCycle: number;
  schemaVersion: number;
  userId: string | null;
  // actions
  setUserId: (id: string | null) => void;
  startPomodoro: (opts?: { duration?: number; mode?: Pomodoro['mode'] }) => Promise<boolean>;
  tickPomodoro: () => void;
  pausePomodoro: () => Promise<void>;
  resumePomodoro: () => Promise<void>;
  completePomodoro: (opts?: { resetToFocus?: boolean }) => Promise<void>;
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
      economy: state.economy ?? { coins: DEFAULT_COINS },
      history: state.history ?? [],
      settings: state.settings ?? DEFAULT_POMODORO_SETTINGS,
      nextMode: state.nextMode ?? DEFAULT_SESSION_PLANNING_STATE.nextMode,
      focusSessionsCompletedInCycle:
        state.focusSessionsCompletedInCycle ?? DEFAULT_SESSION_PLANNING_STATE.focusSessionsCompletedInCycle,
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

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  pomodoro: null,
  economy: { coins: DEFAULT_COINS },
  history: [],
  settings: DEFAULT_POMODORO_SETTINGS,
  settingsLoading: false,
  settingsSaving: false,
  settingsError: null,
  settingsSuccessMessage: null,
  startError: null,
  nextMode: DEFAULT_SESSION_PLANNING_STATE.nextMode,
  focusSessionsCompletedInCycle: DEFAULT_SESSION_PLANNING_STATE.focusSessionsCompletedInCycle,
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
    const mode = opts.mode ?? state.nextMode;
    const duration = opts.duration ?? resolveModeDurationSeconds(settings, mode);

    if (!Number.isFinite(duration) || duration <= 0) {
      set({ startError: 'A configuracao Pomodoro esta invalida. Revise os tempos antes de iniciar.' });
      return false;
    }

    const initialId = Date.now().toString();
    const p: Pomodoro = {
      pomodoroId: initialId,
      title: getSessionTitle(mode),
      mode,
      status: 'running' as const,
      duration,
      remaining: duration,
      isValid: true,
      lostFocusSeconds: 0,
      startedAt: new Date().toISOString(),
    };

    set({ pomodoro: p, settings, startError: null });
    saveToStorage({
      pomodoro: p,
      economy: get().economy,
      history: get().history,
      settings,
      nextMode: state.nextMode,
      focusSessionsCompletedInCycle: state.focusSessionsCompletedInCycle,
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
    if (p.remaining <= 1) {
      // complete
      get().completePomodoro();
      return;
    }
    const updated = { ...p, remaining: p.remaining - 1 };
    set({ pomodoro: updated });
    saveToStorage({
      pomodoro: updated,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
    });
  },

  pausePomodoro: async () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const updated: Pomodoro = { ...p, status: 'paused' as const };
    set({ pomodoro: updated });
    saveToStorage({
      pomodoro: updated,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
    });

    if (s.userId && p.pomodoroId.length > 20) { // Check if it's a UUID
      await updatePomodoroSupabase(p.pomodoroId, { isComplete: false });
    }
  },

  resumePomodoro: async () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const updated: Pomodoro = { ...p, status: 'running' as const };
    set({ pomodoro: updated });
    saveToStorage({
      pomodoro: updated,
      economy: s.economy,
      history: s.history,
      settings: s.settings,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
    });

    if (s.userId && p.pomodoroId.length > 20) {
      await updatePomodoroSupabase(p.pomodoroId, { isComplete: false });
    }
  },

  completePomodoro: async (opts = {}) => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
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
    const nextPlan = opts.resetToFocus
      ? {
        nextMode: 'focus' as const,
        focusSessionsCompletedInCycle: 0,
      }
      : getNextModeAfterCompletion(
        p.mode,
        {
          focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
          nextMode: s.nextMode,
        },
        s.settings,
      );

    set({
      pomodoro: null,
      history: newHistory,
      nextMode: nextPlan.nextMode,
      focusSessionsCompletedInCycle: nextPlan.focusSessionsCompletedInCycle,
    });

    // credit coins only if valid
    if (p.isValid) {
      const coinsToAdd = 5; // configurable later
      get().addCoins(coinsToAdd);
    }
    saveToStorage({
      pomodoro: null,
      economy: get().economy,
      history: newHistory,
      settings: s.settings,
      nextMode: nextPlan.nextMode,
      focusSessionsCompletedInCycle: nextPlan.focusSessionsCompletedInCycle,
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
      economy: s.economy,
      history: s.history,
      settings: s.settings,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
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
      economy: next,
      history: s.history,
      settings: s.settings,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
    });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      set({
        pomodoro: parsed.pomodoro ?? null,
        economy: parsed.economy ?? { coins: DEFAULT_COINS },
        history: parsed.history ?? [],
        settings: sanitizePomodoroSettings(parsed.settings),
        nextMode: parsed.nextMode ?? DEFAULT_SESSION_PLANNING_STATE.nextMode,
        focusSessionsCompletedInCycle:
          parsed.focusSessionsCompletedInCycle ?? DEFAULT_SESSION_PLANNING_STATE.focusSessionsCompletedInCycle,
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
        economy: get().economy,
        history: historyItems,
        settings: get().settings,
        nextMode: get().nextMode,
        focusSessionsCompletedInCycle: get().focusSessionsCompletedInCycle,
      });
    }
  },

  loadSettings: async () => {
    const { userId } = get();
    set({ settingsLoading: true, settingsError: null, settingsSuccessMessage: null });

    if (!userId) {
      const localSettings = loadPomodoroSettingsFromLocalStorage();
      const normalized = sanitizePomodoroSettings(localSettings);
      set({ settings: normalized, settingsLoading: false });
      saveToStorage({
        pomodoro: get().pomodoro,
        economy: get().economy,
        history: get().history,
        settings: normalized,
        nextMode: get().nextMode,
        focusSessionsCompletedInCycle: get().focusSessionsCompletedInCycle,
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
    set({ settings: normalized, settingsLoading: false });
    savePomodoroSettingsToLocalStorage(normalized);
  },

  saveSettings: async (settings) => {
    const normalized = sanitizePomodoroSettings(settings);
    const s = get();

    set({ settingsSaving: true, settingsError: null, settingsSuccessMessage: null, settings: normalized });
    savePomodoroSettingsToLocalStorage(normalized);
    saveToStorage({
      pomodoro: s.pomodoro,
      economy: s.economy,
      history: s.history,
      settings: normalized,
      nextMode: s.nextMode,
      focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
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
      set({ pomodoro: null });
      saveToStorage({
        pomodoro: null,
        economy: s.economy,
        history: s.history,
        settings: s.settings,
        nextMode: s.nextMode,
        focusSessionsCompletedInCycle: s.focusSessionsCompletedInCycle,
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
    usePomodoroStore.setState({
      pomodoro: parsed.pomodoro ?? null,
      economy: parsed.economy ?? { coins: DEFAULT_COINS },
      history: parsed.history ?? [],
      settings: sanitizePomodoroSettings(parsed.settings),
      nextMode: parsed.nextMode ?? DEFAULT_SESSION_PLANNING_STATE.nextMode,
      focusSessionsCompletedInCycle:
        parsed.focusSessionsCompletedInCycle ?? DEFAULT_SESSION_PLANNING_STATE.focusSessionsCompletedInCycle,
      schemaVersion: parsed.schemaVersion ?? 1,
    });
  }
} catch {
  // ignore
}
