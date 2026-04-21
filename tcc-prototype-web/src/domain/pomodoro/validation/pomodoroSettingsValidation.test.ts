import { describe, expect, it } from 'vitest';
import { DEFAULT_POMODORO_SETTINGS } from '../constants/pomodoroSettings';
import {
    sanitizePomodoroSettings,
    validatePomodoroSettingsDraft,
} from './pomodoroSettingsValidation';

describe('Pomodoro settings defaults and validation', () => {
  it('keeps academic defaults 25/5/15/4', () => {
    expect(DEFAULT_POMODORO_SETTINGS).toEqual({
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      cyclesBeforeLongBreak: 4,
      keepSessionRunningOnHiddenTab: false,
    });
  });

  it('rejects invalid draft payload with clear field errors', () => {
    const result = validatePomodoroSettingsDraft({
      focusDurationMinutes: '0',
      shortBreakDurationMinutes: '-1',
      longBreakDurationMinutes: '2',
      cyclesBeforeLongBreak: '13',
      keepSessionRunningOnHiddenTab: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.focusDurationMinutes).toBeTruthy();
    expect(result.errors.shortBreakDurationMinutes).toBeTruthy();
    expect(result.errors.longBreakDurationMinutes).toBeTruthy();
    expect(result.errors.cyclesBeforeLongBreak).toBeTruthy();
  });

  it('sanitizes persisted settings and enforces long break >= short break', () => {
    const sanitized = sanitizePomodoroSettings({
      focusDurationMinutes: 500,
      shortBreakDurationMinutes: 20,
      longBreakDurationMinutes: 10,
      cyclesBeforeLongBreak: 0,
      keepSessionRunningOnHiddenTab: true,
    });

    expect(sanitized.focusDurationMinutes).toBe(120);
    expect(sanitized.shortBreakDurationMinutes).toBe(20);
    expect(sanitized.longBreakDurationMinutes).toBe(20);
    expect(sanitized.cyclesBeforeLongBreak).toBe(1);
    expect(sanitized.keepSessionRunningOnHiddenTab).toBe(true);
  });
});
