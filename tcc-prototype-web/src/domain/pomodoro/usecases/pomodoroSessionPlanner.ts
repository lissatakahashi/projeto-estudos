import { DEFAULT_POMODORO_MODE, getDurationForModeInMinutes } from '../constants/pomodoroSettings';
import type { PomodoroMode } from '../types';
import type { PomodoroSettings } from '../types/PomodoroSettings';

export type SessionPlanningState = {
  focusSessionsCompletedInCycle: number;
  nextMode: PomodoroMode;
};

export const DEFAULT_SESSION_PLANNING_STATE: SessionPlanningState = {
  focusSessionsCompletedInCycle: 0,
  nextMode: DEFAULT_POMODORO_MODE,
};

export function resolveModeDurationSeconds(settings: PomodoroSettings, mode: PomodoroMode): number {
  return getDurationForModeInMinutes(settings, mode) * 60;
}

export function getNextModeAfterCompletion(
  currentMode: PomodoroMode,
  currentState: SessionPlanningState,
  settings: PomodoroSettings,
): SessionPlanningState {
  if (currentMode === 'focus') {
    const nextCompleted = currentState.focusSessionsCompletedInCycle + 1;
    const shouldGoLongBreak = nextCompleted >= settings.cyclesBeforeLongBreak;

    return {
      focusSessionsCompletedInCycle: shouldGoLongBreak ? 0 : nextCompleted,
      nextMode: shouldGoLongBreak ? 'long_break' : 'short_break',
    };
  }

  return {
    focusSessionsCompletedInCycle: currentState.focusSessionsCompletedInCycle,
    nextMode: 'focus',
  };
}
