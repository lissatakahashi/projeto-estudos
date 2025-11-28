export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'finished';

export type Pomodoro = {
  id: string;
  mode: PomodoroMode;
  status: PomodoroStatus;
  duration: number; // planned duration in seconds
  remaining: number; // remaining seconds
  isValid: boolean;
  lostFocusSeconds: number;
  invalidReason?: string;
  startedAt?: string; // ISO
  endedAt?: string; // ISO
};

export type PomodoroHistoryItem = {
  id: string;
  mode: PomodoroMode;
  start: string; // ISO
  end: string; // ISO
  duration: number; // seconds planned
  actualDuration: number; // seconds elapsed
  isValid: boolean;
  invalidReason?: string;
};
