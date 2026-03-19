import { describe, expect, it } from 'vitest';
import { DEFAULT_POMODORO_SETTINGS } from '../constants/pomodoroSettings';
import {
    getNextModeAfterCompletion,
    resolveModeDurationSeconds,
} from './pomodoroSessionPlanner';

describe('pomodoroSessionPlanner', () => {
  it('resolves focus duration from user settings', () => {
    const seconds = resolveModeDurationSeconds(
      {
        ...DEFAULT_POMODORO_SETTINGS,
        focusDurationMinutes: 40,
      },
      'focus',
    );

    expect(seconds).toBe(40 * 60);
  });

  it('moves to long break after configured focus cycles', () => {
    const next = getNextModeAfterCompletion(
      'focus',
      {
        focusSessionsCompletedInCycle: 3,
        nextMode: 'focus',
      },
      DEFAULT_POMODORO_SETTINGS,
    );

    expect(next.nextMode).toBe('long_break');
    expect(next.focusSessionsCompletedInCycle).toBe(0);
  });

  it('returns to focus after any break completion', () => {
    const next = getNextModeAfterCompletion(
      'short_break',
      {
        focusSessionsCompletedInCycle: 2,
        nextMode: 'short_break',
      },
      DEFAULT_POMODORO_SETTINGS,
    );

    expect(next.nextMode).toBe('focus');
    expect(next.focusSessionsCompletedInCycle).toBe(2);
  });
});
