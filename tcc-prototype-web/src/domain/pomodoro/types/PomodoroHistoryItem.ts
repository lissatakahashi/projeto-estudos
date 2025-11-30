import { PomodoroMode } from './PomodoroMode';

export type PomodoroHistoryItemId = string;

export type PomodoroHistoryItem = {
  pomodoroHistoryItemId: PomodoroHistoryItemId;
  mode: PomodoroMode;
  start: string; // ISO
  end: string; // ISO
  duration: number; // seconds planned
  actualDuration: number; // seconds elapsed
  isValid: boolean;
  invalidReason?: string;
};
