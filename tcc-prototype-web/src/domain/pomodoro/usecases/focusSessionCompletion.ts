import type { PomodoroMode } from '../types/enums/PomodoroMode';

export type PomodoroCompletionTrigger = 'timer_elapsed' | 'manual_advance' | 'reset' | 'system';
export type PomodoroSessionStatus = 'completed' | 'invalidated' | 'interrupted';

export type ResolveFocusSessionCompletionInput = {
  mode: PomodoroMode;
  isValid: boolean;
  plannedDurationSeconds: number;
  remainingSeconds: number;
  trigger: PomodoroCompletionTrigger;
};

export type FocusSessionCompletionResolution = {
  shouldPersist: boolean;
  shouldCountAsCompletedFocus: boolean;
  status: PomodoroSessionStatus;
  actualDurationSeconds: number;
};

function clampDuration(input: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, input));
}

export function resolveFocusSessionCompletion(
  input: ResolveFocusSessionCompletionInput,
): FocusSessionCompletionResolution {
  const planned = Math.max(0, input.plannedDurationSeconds);
  const remaining = Math.max(0, input.remainingSeconds);
  const actual = clampDuration(planned - remaining, 0, planned);

  if (input.mode !== 'focus') {
    return {
      shouldPersist: false,
      shouldCountAsCompletedFocus: false,
      status: 'interrupted',
      actualDurationSeconds: actual,
    };
  }

  if (!input.isValid) {
    return {
      shouldPersist: true,
      shouldCountAsCompletedFocus: false,
      status: 'invalidated',
      actualDurationSeconds: actual,
    };
  }

  if (input.trigger === 'timer_elapsed') {
    return {
      shouldPersist: true,
      shouldCountAsCompletedFocus: true,
      status: 'completed',
      actualDurationSeconds: planned,
    };
  }

  return {
    shouldPersist: true,
    shouldCountAsCompletedFocus: false,
    status: 'interrupted',
    actualDurationSeconds: actual,
  };
}
