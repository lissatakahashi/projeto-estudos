import type { PomodoroMode } from './enums/PomodoroMode';
import type { PomodoroSettings } from './PomodoroSettings';

export type PomodoroCyclePhase = 'idle' | PomodoroMode | 'paused' | 'completed';

export type PomodoroCycleState = {
  phase: PomodoroCyclePhase;
  activeMode: PomodoroMode;
  nextMode: PomodoroMode;
  phaseDurationSeconds: number;
  remainingSeconds: number;
  focusSessionsCompletedInCycle: number;
  totalFocusSessionsCompleted: number;
};

export type PomodoroPhaseTransition = {
  nextMode: PomodoroMode;
  focusSessionsCompletedInCycle: number;
  totalFocusSessionsCompleted: number;
};

export type PomodoroCycleCompletionResult = {
  state: PomodoroCycleState;
  completedMode: PomodoroMode;
};

export type PomodoroCycleSnapshot = Pick<
  PomodoroCycleState,
  | 'phase'
  | 'activeMode'
  | 'nextMode'
  | 'phaseDurationSeconds'
  | 'remainingSeconds'
  | 'focusSessionsCompletedInCycle'
  | 'totalFocusSessionsCompleted'
>;

export function getModeDurationSeconds(settings: PomodoroSettings, mode: PomodoroMode): number {
  if (mode === 'short_break') {
    return settings.shortBreakDurationMinutes * 60;
  }

  if (mode === 'long_break') {
    return settings.longBreakDurationMinutes * 60;
  }

  return settings.focusDurationMinutes * 60;
}
