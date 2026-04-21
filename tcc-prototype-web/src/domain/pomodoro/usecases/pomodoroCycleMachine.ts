import type { PomodoroMode } from '../types/enums/PomodoroMode';
import type {
    PomodoroCycleCompletionResult,
    PomodoroCyclePhase,
    PomodoroCycleSnapshot,
    PomodoroCycleState,
    PomodoroPhaseTransition,
} from '../types/PomodoroCycle';
import { getModeDurationSeconds } from '../types/PomodoroCycle';
import type { PomodoroSettings } from '../types/PomodoroSettings';

const DEFAULT_MODE: PomodoroMode = 'focus';

export function getNextModeForActivePhase(
  activeMode: PomodoroMode,
  currentState: PomodoroCycleSnapshot,
  settings: PomodoroSettings,
): PomodoroMode {
  return getNextPhaseAfterCompletion(activeMode, currentState, settings).nextMode;
}

function createRunningState(base: PomodoroCycleSnapshot, mode: PomodoroMode, settings: PomodoroSettings): PomodoroCycleState {
  const durationSeconds = getModeDurationSeconds(settings, mode);
  const nextMode = getNextModeForActivePhase(mode, base, settings);

  return {
    ...base,
    phase: mode,
    activeMode: mode,
    nextMode,
    phaseDurationSeconds: durationSeconds,
    remainingSeconds: durationSeconds,
  };
}

export function createIdlePomodoroCycleState(settings: PomodoroSettings): PomodoroCycleState {
  const focusDuration = getModeDurationSeconds(settings, DEFAULT_MODE);

  return {
    phase: 'idle',
    activeMode: DEFAULT_MODE,
    nextMode: DEFAULT_MODE,
    phaseDurationSeconds: focusDuration,
    remainingSeconds: focusDuration,
    focusSessionsCompletedInCycle: 0,
    totalFocusSessionsCompleted: 0,
  };
}

export function getNextPhaseAfterCompletion(
  completedMode: PomodoroMode,
  currentState: PomodoroCycleSnapshot,
  settings: PomodoroSettings,
): PomodoroPhaseTransition {
  if (completedMode === 'focus') {
    const updatedFocusInCycle = currentState.focusSessionsCompletedInCycle + 1;
    const willUseLongBreak = updatedFocusInCycle >= settings.cyclesBeforeLongBreak;

    return {
      nextMode: willUseLongBreak ? 'long_break' : 'short_break',
      focusSessionsCompletedInCycle: willUseLongBreak ? 0 : updatedFocusInCycle,
      totalFocusSessionsCompleted: currentState.totalFocusSessionsCompleted + 1,
    };
  }

  return {
    nextMode: 'focus',
    focusSessionsCompletedInCycle: currentState.focusSessionsCompletedInCycle,
    totalFocusSessionsCompleted: currentState.totalFocusSessionsCompleted,
  };
}

export function startPomodoroCycle(
  currentState: PomodoroCycleSnapshot,
  settings: PomodoroSettings,
  mode: PomodoroMode = DEFAULT_MODE,
): PomodoroCycleState {
  return createRunningState(currentState, mode, settings);
}

export function pausePomodoroCycle(currentState: PomodoroCycleSnapshot): PomodoroCycleState {
  if (currentState.phase !== 'focus' && currentState.phase !== 'short_break' && currentState.phase !== 'long_break') {
    return {
      ...currentState,
      phase: currentState.phase,
    };
  }

  return {
    ...currentState,
    phase: 'paused',
    activeMode: currentState.phase,
  };
}

export function resumePomodoroCycle(currentState: PomodoroCycleSnapshot): PomodoroCycleState {
  if (currentState.phase !== 'paused') {
    return {
      ...currentState,
      phase: currentState.phase,
    };
  }

  return {
    ...currentState,
    phase: currentState.activeMode,
    nextMode: currentState.nextMode,
  };
}

export function resetPomodoroCycle(settings: PomodoroSettings): PomodoroCycleState {
  return createIdlePomodoroCycleState(settings);
}

export function completeCurrentPhase(
  currentState: PomodoroCycleSnapshot,
  settings: PomodoroSettings,
): PomodoroCycleCompletionResult {
  const completedMode = currentState.activeMode;
  const transition = getNextPhaseAfterCompletion(completedMode, currentState, settings);

  return {
    completedMode,
    state: {
      ...currentState,
      phase: 'completed',
      activeMode: completedMode,
      nextMode: transition.nextMode,
      remainingSeconds: 0,
      focusSessionsCompletedInCycle: transition.focusSessionsCompletedInCycle,
      totalFocusSessionsCompleted: transition.totalFocusSessionsCompleted,
    },
  };
}

export function moveToNextPhase(currentState: PomodoroCycleSnapshot, settings: PomodoroSettings): PomodoroCycleState {
  const targetMode = currentState.nextMode;
  return createRunningState(currentState, targetMode, settings);
}

export function getHumanReadablePhaseLabel(phase: PomodoroCyclePhase, activeMode: PomodoroMode): string {
  if (phase === 'idle') return 'idle';
  if (phase === 'completed') return 'completed';
  if (phase === 'paused') return 'paused';
  return activeMode;
}
