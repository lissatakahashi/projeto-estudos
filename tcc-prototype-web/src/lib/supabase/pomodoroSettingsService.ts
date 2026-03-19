import { DEFAULT_POMODORO_SETTINGS } from '../../domain/pomodoro/constants/pomodoroSettings';
import type { PomodoroSettings } from '../../domain/pomodoro/types/PomodoroSettings';
import { sanitizePomodoroSettings } from '../../domain/pomodoro/validation/pomodoroSettingsValidation';
import { supabase } from './client';
import type { Database } from './types';

type PomodoroSettingsRow = Database['public']['Tables']['userPomodoroSettings']['Row'];
type PomodoroSettingsInsert = Database['public']['Tables']['userPomodoroSettings']['Insert'];

type PomodoroSettingsServiceError = {
  message: string;
  originalError?: unknown;
};

const LOCAL_SETTINGS_STORAGE_KEY = 'pomodoro_settings_v1';

export function mapRecordToPomodoroSettings(record: PomodoroSettingsRow): PomodoroSettings {
  return sanitizePomodoroSettings({
    focusDurationMinutes: record.focusDurationMinutes,
    shortBreakDurationMinutes: record.shortBreakDurationMinutes,
    longBreakDurationMinutes: record.longBreakDurationMinutes,
    cyclesBeforeLongBreak: record.cyclesBeforeLongBreak,
  });
}

export function mapSettingsToRecord(userId: string, settings: PomodoroSettings): PomodoroSettingsInsert {
  return {
    userId,
    focusDurationMinutes: settings.focusDurationMinutes,
    shortBreakDurationMinutes: settings.shortBreakDurationMinutes,
    longBreakDurationMinutes: settings.longBreakDurationMinutes,
    cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
  };
}

export function savePomodoroSettingsToLocalStorage(settings: PomodoroSettings): void {
  localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function loadPomodoroSettingsFromLocalStorage(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_POMODORO_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return sanitizePomodoroSettings(parsed);
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export async function getUserPomodoroSettings(
  userId: string,
): Promise<{ data: PomodoroSettings | null; error: PomodoroSettingsServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('userPomodoroSettings')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: { message: 'Erro ao buscar configuracao Pomodoro.', originalError: error },
      };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return { data: mapRecordToPomodoroSettings(data), error: null };
  } catch (originalError) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao buscar configuracao Pomodoro.', originalError },
    };
  }
}

export async function upsertUserPomodoroSettings(
  userId: string,
  settings: PomodoroSettings,
): Promise<{ data: PomodoroSettings | null; error: PomodoroSettingsServiceError | null }> {
  try {
    const payload = mapSettingsToRecord(userId, settings);

    const { data, error } = await supabase
      .from('userPomodoroSettings')
      .upsert(payload, { onConflict: 'userId' })
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: { message: 'Erro ao salvar configuracao Pomodoro.', originalError: error },
      };
    }

    return { data: mapRecordToPomodoroSettings(data), error: null };
  } catch (originalError) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao salvar configuracao Pomodoro.', originalError },
    };
  }
}
