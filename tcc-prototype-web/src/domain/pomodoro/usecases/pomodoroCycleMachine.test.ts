import { describe, expect, it } from 'vitest';
import { DEFAULT_POMODORO_SETTINGS } from '../constants/pomodoroSettings';
import {
    completeCurrentPhase,
    createIdlePomodoroCycleState,
    getNextModeForActivePhase,
    getNextPhaseAfterCompletion,
    moveToNextPhase,
    pausePomodoroCycle,
    resetPomodoroCycle,
    resumePomodoroCycle,
    startPomodoroCycle,
} from './pomodoroCycleMachine';

describe('pomodoroCycleMachine', () => {
  it('starts a focus phase with configured duration', () => {
    const settings = {
      ...DEFAULT_POMODORO_SETTINGS,
      focusDurationMinutes: 30,
    };

    const idleState = createIdlePomodoroCycleState(settings);
    const running = startPomodoroCycle(idleState, settings, 'focus');

    expect(running.phase).toBe('focus');
    expect(running.activeMode).toBe('focus');
    expect(running.nextMode).toBe('short_break');
    expect(running.remainingSeconds).toBe(30 * 60);
    expect(running.phaseDurationSeconds).toBe(30 * 60);
  });

  it('computes next mode for focus as long break at threshold', () => {
    const settings = {
      ...DEFAULT_POMODORO_SETTINGS,
      cyclesBeforeLongBreak: 2,
    };

    const nextMode = getNextModeForActivePhase(
      'focus',
      {
        ...createIdlePomodoroCycleState(settings),
        focusSessionsCompletedInCycle: 1,
      },
      settings,
    );

    expect(nextMode).toBe('long_break');
  });

  it('transitions from focus to short break before reaching long-break threshold', () => {
    const settings = {
      ...DEFAULT_POMODORO_SETTINGS,
      cyclesBeforeLongBreak: 4,
    };

    const focusRunning = {
      ...createIdlePomodoroCycleState(settings),
      phase: 'focus' as const,
      activeMode: 'focus' as const,
      nextMode: 'focus' as const,
      remainingSeconds: 0,
      phaseDurationSeconds: settings.focusDurationMinutes * 60,
      focusSessionsCompletedInCycle: 1,
      totalFocusSessionsCompleted: 1,
    };

    const completed = completeCurrentPhase(focusRunning, settings);
    expect(completed.state.phase).toBe('completed');
    expect(completed.state.nextMode).toBe('short_break');
    expect(completed.state.focusSessionsCompletedInCycle).toBe(2);

    const nextPhase = moveToNextPhase(completed.state, settings);
    expect(nextPhase.phase).toBe('short_break');
  });

  it('transitions to long break after configured focus count', () => {
    const settings = {
      ...DEFAULT_POMODORO_SETTINGS,
      cyclesBeforeLongBreak: 2,
    };

    const focusRunning = {
      ...createIdlePomodoroCycleState(settings),
      phase: 'focus' as const,
      activeMode: 'focus' as const,
      remainingSeconds: 0,
      focusSessionsCompletedInCycle: 1,
      totalFocusSessionsCompleted: 5,
    };

    const completed = completeCurrentPhase(focusRunning, settings);
    expect(completed.state.nextMode).toBe('long_break');
    expect(completed.state.focusSessionsCompletedInCycle).toBe(0);
    expect(completed.state.totalFocusSessionsCompleted).toBe(6);
  });

  it('supports pause and resume without changing counters', () => {
    const idle = createIdlePomodoroCycleState(DEFAULT_POMODORO_SETTINGS);
    const running = startPomodoroCycle(idle, DEFAULT_POMODORO_SETTINGS, 'focus');

    const paused = pausePomodoroCycle(running);
    expect(paused.phase).toBe('paused');
    expect(paused.activeMode).toBe('focus');

    const resumed = resumePomodoroCycle(paused);
    expect(resumed.phase).toBe('focus');
    expect(resumed.focusSessionsCompletedInCycle).toBe(running.focusSessionsCompletedInCycle);
    expect(resumed.totalFocusSessionsCompleted).toBe(running.totalFocusSessionsCompleted);
  });

  it('resets machine to idle and keeps configured focus preview duration', () => {
    const settings = {
      ...DEFAULT_POMODORO_SETTINGS,
      focusDurationMinutes: 50,
    };

    const reset = resetPomodoroCycle(settings);
    expect(reset.phase).toBe('idle');
    expect(reset.nextMode).toBe('focus');
    expect(reset.remainingSeconds).toBe(50 * 60);
  });

  it('computes next phase from short break and long break back to focus', () => {
    const shortBreakTransition = getNextPhaseAfterCompletion(
      'short_break',
      {
        ...createIdlePomodoroCycleState(DEFAULT_POMODORO_SETTINGS),
        phase: 'short_break',
        activeMode: 'short_break',
      },
      DEFAULT_POMODORO_SETTINGS,
    );

    const longBreakTransition = getNextPhaseAfterCompletion(
      'long_break',
      {
        ...createIdlePomodoroCycleState(DEFAULT_POMODORO_SETTINGS),
        phase: 'long_break',
        activeMode: 'long_break',
      },
      DEFAULT_POMODORO_SETTINGS,
    );

    expect(shortBreakTransition.nextMode).toBe('focus');
    expect(longBreakTransition.nextMode).toBe('focus');
  });
});
