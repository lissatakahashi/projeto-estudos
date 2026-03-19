export type PomodoroSettings = {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  cyclesBeforeLongBreak: number;
};

export type PomodoroSettingsField = keyof PomodoroSettings;

export type PomodoroSettingsDraft = Record<PomodoroSettingsField, string>;

export type PomodoroSettingsErrors = Partial<Record<PomodoroSettingsField, string>>;

export type PomodoroSettingsValidationResult = {
  isValid: boolean;
  normalized?: PomodoroSettings;
  errors: PomodoroSettingsErrors;
};

export const POMODORO_SETTINGS_FIELD_LABELS: Record<PomodoroSettingsField, string> = {
  focusDurationMinutes: 'Duracao do foco',
  shortBreakDurationMinutes: 'Duracao da pausa curta',
  longBreakDurationMinutes: 'Duracao da pausa longa',
  cyclesBeforeLongBreak: 'Ciclos antes da pausa longa',
};

export function settingsToDraft(settings: PomodoroSettings): PomodoroSettingsDraft {
  return {
    focusDurationMinutes: String(settings.focusDurationMinutes),
    shortBreakDurationMinutes: String(settings.shortBreakDurationMinutes),
    longBreakDurationMinutes: String(settings.longBreakDurationMinutes),
    cyclesBeforeLongBreak: String(settings.cyclesBeforeLongBreak),
  };
}
