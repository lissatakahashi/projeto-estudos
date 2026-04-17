import { describe, expect, it } from 'vitest';
import { canEditPomodoroSettings, isPomodoroConfigLocked } from './pomodoroSettingsLock';

describe('pomodoroSettingsLock', () => {
  it('keeps settings editable when cycle is idle and there is no active pomodoro', () => {
    const locked = isPomodoroConfigLocked({
      cyclePhase: 'idle',
      activePomodoro: null,
    });

    expect(locked).toBe(false);
    expect(
      canEditPomodoroSettings({
        cyclePhase: 'idle',
        activePomodoro: null,
      }),
    ).toBe(true);
  });

  it('locks settings during running focus cycle', () => {
    expect(
      isPomodoroConfigLocked({
        cyclePhase: 'focus',
        activePomodoro: {
          pomodoroId: '1',
          title: 'Foco',
          mode: 'focus',
          status: 'running',
          duration: 1500,
          remaining: 1200,
          isValid: true,
          lostFocusSeconds: 0,
        },
      }),
    ).toBe(true);
  });

  it('locks settings when paused', () => {
    expect(
      canEditPomodoroSettings({
        cyclePhase: 'paused',
        activePomodoro: {
          pomodoroId: '2',
          title: 'Foco',
          mode: 'focus',
          status: 'paused',
          duration: 1500,
          remaining: 1000,
          isValid: true,
          lostFocusSeconds: 0,
        },
      }),
    ).toBe(false);
  });

  it('re-enables settings when cycle is completed and no active pomodoro remains', () => {
    expect(
      canEditPomodoroSettings({
        cyclePhase: 'completed',
        activePomodoro: null,
      }),
    ).toBe(true);
  });
});
