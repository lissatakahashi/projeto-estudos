import create from 'zustand';
import { Pomodoro, PomodoroHistoryItem } from '../domain/pomodoro/types';

const STORAGE_KEY = 'pomodoro_state_v1';
const DEFAULT_COINS = 0;
const LOST_FOCUS_THRESHOLD = 15; // seconds to mark invalid

type PomodoroStore = {
  pomodoro: Pomodoro | null;
  economy: { coins: number };
  history: PomodoroHistoryItem[];
  schemaVersion: number;
  // actions
  startPomodoro: (opts?: { duration?: number; mode?: Pomodoro['mode'] }) => void;
  tickPomodoro: () => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  completePomodoro: () => void;
  penalizeLostFocus: (seconds: number) => void;
  addCoins: (amount: number) => void;
  loadFromStorage: () => void;
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

  startPomodoro: (opts = {}) => {
    const duration = opts.duration ?? 25 * 60;
    const mode = opts.mode ?? 'focus';
    const p: Pomodoro = {
      id: Date.now().toString(),
      mode,
      status: 'running',
      duration,
      remaining: duration,
      isValid: true,
      lostFocusSeconds: 0,
      startedAt: new Date().toISOString(),
    };
    set({ pomodoro: p });
    saveToStorage({ pomodoro: p, economy: get().economy, history: get().history });
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

  pausePomodoro: () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const updated = { ...p, status: 'paused' };
    set({ pomodoro: updated });
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });
  },

  resumePomodoro: () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const updated = { ...p, status: 'running' };
    set({ pomodoro: updated });
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });
  },

  completePomodoro: () => {
    const s = get();
    const p = s.pomodoro;
    if (!p) return;
    const endedAt = new Date().toISOString();
    const historyItem: PomodoroHistoryItem = {
      id: p.id,
      mode: p.mode,
      start: p.startedAt ?? endedAt,
      end: endedAt,
      duration: p.duration,
      actualDuration: p.duration - p.remaining,
      isValid: p.isValid,
      invalidReason: p.invalidReason,
    };
    const newHistory = [historyItem, ...s.history].slice(0, 200);
    const updatedPomodoro = { ...p, status: 'finished', endedAt };
    set({ pomodoro: null, history: newHistory });
    // credit coins only if valid
    if (p.isValid) {
      const coinsToAdd = 5; // configurable later
      get().addCoins(coinsToAdd);
    }
    saveToStorage({ pomodoro: null, economy: get().economy, history: newHistory });
  },

  penalizeLostFocus: (seconds: number) => {
    const s = get();
    const p = s.pomodoro;
    if (!p || p.status !== 'running') return;
    const lost = p.lostFocusSeconds + seconds;
    const isValid = lost <= LOST_FOCUS_THRESHOLD;
    const updated = { ...p, lostFocusSeconds: lost, isValid, invalidReason: isValid ? undefined : 'lost_focus' };
    set({ pomodoro: updated });
    saveToStorage({ pomodoro: updated, economy: s.economy, history: s.history });
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
