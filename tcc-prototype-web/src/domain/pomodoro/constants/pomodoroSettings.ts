import type { PomodoroMode } from '../types';
import type { PomodoroSettings } from '../types/PomodoroSettings';

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export const POMODORO_SETTINGS_LIMITS = {
  focusDurationMinutes: { min: 5, max: 120 },
  shortBreakDurationMinutes: { min: 1, max: 30 },
  longBreakDurationMinutes: { min: 5, max: 60 },
  cyclesBeforeLongBreak: { min: 1, max: 12 },
} as const;

export const DEFAULT_POMODORO_MODE: PomodoroMode = 'focus';

export function getDurationForModeInMinutes(settings: PomodoroSettings, mode: PomodoroMode): number {
  if (mode === 'short_break') {
    return settings.shortBreakDurationMinutes;
  }
  if (mode === 'long_break') {
    return settings.longBreakDurationMinutes;
  }
  return settings.focusDurationMinutes;
}
