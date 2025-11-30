import { PomodoroMode } from './PomodoroMode';
import { PomodoroStatus } from './PomodoroStatus';

export type PomodoroId = string;

export type Pomodoro = {
  pomodoroId: PomodoroId;
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
