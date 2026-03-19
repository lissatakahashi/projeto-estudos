import { describe, expect, it } from 'vitest';
import {
    mapRecordToPomodoroSettings,
    mapSettingsToRecord,
} from './pomodoroSettingsService';

describe('pomodoroSettingsService mappers', () => {
  it('maps domain settings to insert payload', () => {
    const payload = mapSettingsToRecord('user-1', {
      focusDurationMinutes: 30,
      shortBreakDurationMinutes: 6,
      longBreakDurationMinutes: 18,
      cyclesBeforeLongBreak: 3,
    });

    expect(payload).toEqual({
      userId: 'user-1',
      focusDurationMinutes: 30,
      shortBreakDurationMinutes: 6,
      longBreakDurationMinutes: 18,
      cyclesBeforeLongBreak: 3,
    });
  });

  it('maps and sanitizes settings loaded from database', () => {
    const mapped = mapRecordToPomodoroSettings({
      userId: 'user-1',
      focusDurationMinutes: 2,
      shortBreakDurationMinutes: 10,
      longBreakDurationMinutes: 5,
      cyclesBeforeLongBreak: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(mapped.focusDurationMinutes).toBe(5);
    expect(mapped.shortBreakDurationMinutes).toBe(10);
    expect(mapped.longBreakDurationMinutes).toBe(10);
    expect(mapped.cyclesBeforeLongBreak).toBe(12);
  });
});
