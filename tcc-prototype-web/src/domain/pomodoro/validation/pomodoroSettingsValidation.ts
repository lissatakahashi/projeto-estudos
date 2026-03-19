import { DEFAULT_POMODORO_SETTINGS, POMODORO_SETTINGS_LIMITS } from '../constants/pomodoroSettings';
import {
    POMODORO_SETTINGS_FIELD_LABELS,
    type PomodoroSettings,
    type PomodoroSettingsDraft,
    type PomodoroSettingsErrors,
    type PomodoroSettingsField,
    type PomodoroSettingsValidationResult,
} from '../types/PomodoroSettings';

const SETTINGS_FIELDS: PomodoroSettingsField[] = [
  'focusDurationMinutes',
  'shortBreakDurationMinutes',
  'longBreakDurationMinutes',
  'cyclesBeforeLongBreak',
];

function parsePositiveInteger(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const asNumber = Number(trimmed);
  if (!Number.isInteger(asNumber) || asNumber <= 0) {
    return null;
  }

  return asNumber;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSettingsDraftValue(rawValue: string): string {
  return rawValue.replace(/\D/g, '');
}

export function validatePomodoroSettingsDraft(draft: PomodoroSettingsDraft): PomodoroSettingsValidationResult {
  const errors: PomodoroSettingsErrors = {};
  const parsedValues = {} as Record<PomodoroSettingsField, number>;

  SETTINGS_FIELDS.forEach((field) => {
    const parsed = parsePositiveInteger(draft[field]);
    if (parsed == null) {
      errors[field] = `${POMODORO_SETTINGS_FIELD_LABELS[field]} deve ser um inteiro positivo.`;
      return;
    }

    const limits = POMODORO_SETTINGS_LIMITS[field];
    if (parsed < limits.min || parsed > limits.max) {
      errors[field] = `${POMODORO_SETTINGS_FIELD_LABELS[field]} deve estar entre ${limits.min} e ${limits.max} minutos.`;
      return;
    }

    parsedValues[field] = parsed;
  });

  if (
    parsedValues.longBreakDurationMinutes != null
    && parsedValues.shortBreakDurationMinutes != null
    && parsedValues.longBreakDurationMinutes < parsedValues.shortBreakDurationMinutes
  ) {
    errors.longBreakDurationMinutes = 'A pausa longa deve ser maior ou igual a pausa curta.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    normalized: {
      focusDurationMinutes: parsedValues.focusDurationMinutes,
      shortBreakDurationMinutes: parsedValues.shortBreakDurationMinutes,
      longBreakDurationMinutes: parsedValues.longBreakDurationMinutes,
      cyclesBeforeLongBreak: parsedValues.cyclesBeforeLongBreak,
    },
    errors: {},
  };
}

export function sanitizePomodoroSettings(input?: Partial<PomodoroSettings> | null): PomodoroSettings {
  const source = input ?? {};
  const merged: PomodoroSettings = {
    focusDurationMinutes: source.focusDurationMinutes ?? DEFAULT_POMODORO_SETTINGS.focusDurationMinutes,
    shortBreakDurationMinutes: source.shortBreakDurationMinutes ?? DEFAULT_POMODORO_SETTINGS.shortBreakDurationMinutes,
    longBreakDurationMinutes: source.longBreakDurationMinutes ?? DEFAULT_POMODORO_SETTINGS.longBreakDurationMinutes,
    cyclesBeforeLongBreak: source.cyclesBeforeLongBreak ?? DEFAULT_POMODORO_SETTINGS.cyclesBeforeLongBreak,
  };

  const normalized: PomodoroSettings = {
    focusDurationMinutes: clamp(
      Math.trunc(merged.focusDurationMinutes),
      POMODORO_SETTINGS_LIMITS.focusDurationMinutes.min,
      POMODORO_SETTINGS_LIMITS.focusDurationMinutes.max,
    ),
    shortBreakDurationMinutes: clamp(
      Math.trunc(merged.shortBreakDurationMinutes),
      POMODORO_SETTINGS_LIMITS.shortBreakDurationMinutes.min,
      POMODORO_SETTINGS_LIMITS.shortBreakDurationMinutes.max,
    ),
    longBreakDurationMinutes: clamp(
      Math.trunc(merged.longBreakDurationMinutes),
      POMODORO_SETTINGS_LIMITS.longBreakDurationMinutes.min,
      POMODORO_SETTINGS_LIMITS.longBreakDurationMinutes.max,
    ),
    cyclesBeforeLongBreak: clamp(
      Math.trunc(merged.cyclesBeforeLongBreak),
      POMODORO_SETTINGS_LIMITS.cyclesBeforeLongBreak.min,
      POMODORO_SETTINGS_LIMITS.cyclesBeforeLongBreak.max,
    ),
  };

  if (normalized.longBreakDurationMinutes < normalized.shortBreakDurationMinutes) {
    normalized.longBreakDurationMinutes = normalized.shortBreakDurationMinutes;
  }

  return normalized;
}
