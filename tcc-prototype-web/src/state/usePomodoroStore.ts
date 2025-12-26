import create from 'zustand';
import { Pomodoro, PomodoroHistoryItem } from '../domain/pomodoro/types';
import {
  createPomodoro as createPomodoroSupabase,
  updatePomodoro as updatePomodoroSupabase,
  listPomodoros as listPomodorosSupabase,
  mapPomodoroToRecord,
  mapRecordToPomodoro,
} from '../lib/supabase/pomodoroService';

import { supabase } from '../lib/supabase/client';

const STORAGE_KEY = 'pomodoro_state_v1';
const DEFAULT_COINS = 0;
const LOST_FOCUS_THRESHOLD = 15; // seconds to mark invalid

type PomodoroStore = {
  pomodoro: Pomodoro | null;
  economy: { coins: number };
  history: PomodoroHistoryItem[];
  schemaVersion: number;
  userId: string | null;
  // actions
  setUserId: (id: string | null) => void;
  startPomodoro: (opts?: { duration?: number; mode?: Pomodoro['mode'] }) => Promise<void>;
  tickPomodoro: () => void;
  pausePomodoro: () => Promise<void>;
  resumePomodoro: () => Promise<void>;
  completePomodoro: () => Promise<void>;
  penalizeLostFocus: (seconds: number) => Promise<void>;
  addCoins: (amount: number) => void;
  loadFromStorage: () => void;
  loadHistory: () => Promise<void>;
  clearExpiredSession: () => void;
};

function saveToStorage(state: Partial<PomodoroStore>) {
  try {
    const payload = JSON.stringify({
      pomodoro: state.pomodoro ?? null,
      economy: state.economy ?? { coins: DEFAULT_COINS },
      history: state.history ?? [],
      schemaVersion: 1,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (e) {
    // ignore
  }
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  pomodoro: null,
  economy: { coins: DEFAULT_COINS },
  history: [],
  schemaVersion: 1,
  userId: null,

  setUserId: (id) => {
    set({ userId: id });
    if (id) {
      get().loadHistory();
    }
  },

  startPomodoro: async (opts = {}) => {
    const duration = opts.duration ?? 25 * 60;
    const mode = opts.mode ?? 'focus';
    const initialId = Date.now().toString();
    const p: Pomodoro = {
      pomodoroId: initialId,
      title: opts.mode === 'focus' ? 'Foco' : 'Pausa',
      mode,
      status: 'running' as const,
      duration,
      remaining: duration,
      isValid: true,
      lostFocusSeconds: 0,
      startedAt: new Date().toISOString(),
    };

    set({ pomodoro: p });
    saveToStorage({ pomodoro: p, economy: get().economy, history: get().history });

    // Sync with Supabase if logged in
    const { userId } = get();
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
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });
  },

  pausePomodoro: async () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const updated: Pomodoro = { ...p, status: 'paused' as const };
    set({ pomodoro: updated });
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });

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
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });

    if (s.userId && p.pomodoroId.length > 20) {
      await updatePomodoroSupabase(p.pomodoroId, { isComplete: false });
    }
  },

  completePomodoro: async () => {
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
    set({ pomodoro: null, history: newHistory });

    // credit coins only if valid
    if (p.isValid) {
      const coinsToAdd = 5; // configurable later
      get().addCoins(coinsToAdd);
    }
    saveToStorage({ pomodoro: null, economy: get().economy, history: newHistory });

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
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });

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
    saveToStorage({ pomodoro: s.pomodoro, economy: next, history: s.history });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // basic validation
      set({ pomodoro: parsed.pomodoro ?? null, economy: parsed.economy ?? { coins: DEFAULT_COINS }, history: parsed.history ?? [], schemaVersion: parsed.schemaVersion ?? 1 });
    } catch (e) {
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
      saveToStorage({ pomodoro: get().pomodoro, economy: get().economy, history: historyItems });
    }
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
      saveToStorage({ pomodoro: null, economy: s.economy, history: s.history });
    }
  },
}));

// Listen for Auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  usePomodoroStore.getState().setUserId(session?.user?.id ?? null);
});

// try to initialize from storage
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const store = usePomodoroStore.getState();
    usePomodoroStore.setState({ pomodoro: parsed.pomodoro ?? null, economy: parsed.economy ?? { coins: DEFAULT_COINS }, history: parsed.history ?? [], schemaVersion: parsed.schemaVersion ?? 1 });
  }
} catch (e) {
  // ignore
}
