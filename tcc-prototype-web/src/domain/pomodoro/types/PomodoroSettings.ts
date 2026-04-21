export type PomodoroSettings = {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  cyclesBeforeLongBreak: number;
  keepSessionRunningOnHiddenTab: boolean;
};

export type PomodoroSettingsField = keyof PomodoroSettings;

export type PomodoroNumericSettingsField = Exclude<PomodoroSettingsField, 'keepSessionRunningOnHiddenTab'>;

export type PomodoroSettingsDraft = {
  focusDurationMinutes: string;
  shortBreakDurationMinutes: string;
  longBreakDurationMinutes: string;
  cyclesBeforeLongBreak: string;
  keepSessionRunningOnHiddenTab: boolean;
};

export type PomodoroSettingsErrors = Partial<Record<PomodoroNumericSettingsField, string>>;

export type PomodoroSettingsValidationResult = {
  isValid: boolean;
  normalized?: PomodoroSettings;
  errors: PomodoroSettingsErrors;
};

export const POMODORO_SETTINGS_FIELD_LABELS: Record<PomodoroNumericSettingsField, string> = {
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
    keepSessionRunningOnHiddenTab: settings.keepSessionRunningOnHiddenTab,
  };
}
