import { describe, expect, it, vi } from 'vitest';
import {
    mapRecordToPomodoroSettings,
    mapSettingsToRecord,
} from './pomodoroSettingsService';

vi.mock('./client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('pomodoroSettingsService mappers', () => {
  it('maps domain settings to insert payload', () => {
    const payload = mapSettingsToRecord('user-1', {
      focusDurationMinutes: 30,
      shortBreakDurationMinutes: 6,
      longBreakDurationMinutes: 18,
      cyclesBeforeLongBreak: 3,
      keepSessionRunningOnHiddenTab: true,
    });

    expect(payload).toEqual({
      userId: 'user-1',
      focusDurationMinutes: 30,
      shortBreakDurationMinutes: 6,
      longBreakDurationMinutes: 18,
      cyclesBeforeLongBreak: 3,
      keepSessionRunningOnHiddenTab: true,
    });
  });

  it('maps and sanitizes settings loaded from database', () => {
    const mapped = mapRecordToPomodoroSettings({
      userId: 'user-1',
      focusDurationMinutes: 2,
      shortBreakDurationMinutes: 10,
      longBreakDurationMinutes: 5,
      cyclesBeforeLongBreak: 20,
      keepSessionRunningOnHiddenTab: null as unknown as boolean,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(mapped.focusDurationMinutes).toBe(5);
    expect(mapped.shortBreakDurationMinutes).toBe(10);
    expect(mapped.longBreakDurationMinutes).toBe(10);
    expect(mapped.cyclesBeforeLongBreak).toBe(12);
    expect(mapped.keepSessionRunningOnHiddenTab).toBe(false);
  });
});
