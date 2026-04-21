import type { PomodoroNumericSettingsField } from '../types/PomodoroSettings';
import { POMODORO_SETTINGS_LIMITS } from './pomodoroSettings';

export type PomodoroFieldGuidance = {
  label: string;
  description: string;
  recommendation: string;
};

export const POMODORO_SETTINGS_GENERAL_GUIDANCE = {
  title: 'Configure como suas sessões de estudo e pausas vão funcionar.',
  description:
    'Essas definições controlam o tempo de foco, os intervalos curtos e a pausa longa do seu ciclo Pomodoro.',
} as const;

export const POMODORO_SETTINGS_FIELD_GUIDANCE: Record<PomodoroNumericSettingsField, PomodoroFieldGuidance> = {
  focusDurationMinutes: {
    label: 'Duração do foco (minutos)',
    description: 'Tempo em que você permanece concentrado na atividade antes de fazer uma pausa.',
    recommendation: `Valor recomendado entre ${POMODORO_SETTINGS_LIMITS.focusDurationMinutes.min} e ${POMODORO_SETTINGS_LIMITS.focusDurationMinutes.max} minutos.`,
  },
  shortBreakDurationMinutes: {
    label: 'Duração da pausa curta (minutos)',
    description: 'Intervalo breve entre as sessões de foco para recuperar energia.',
    recommendation: `Valor recomendado entre ${POMODORO_SETTINGS_LIMITS.shortBreakDurationMinutes.min} e ${POMODORO_SETTINGS_LIMITS.shortBreakDurationMinutes.max} minutos.`,
  },
  longBreakDurationMinutes: {
    label: 'Duração da pausa longa (minutos)',
    description: 'Intervalo maior para descanso mais completo após vários ciclos de foco.',
    recommendation: `Valor recomendado entre ${POMODORO_SETTINGS_LIMITS.longBreakDurationMinutes.min} e ${POMODORO_SETTINGS_LIMITS.longBreakDurationMinutes.max} minutos e maior ou igual a pausa curta.`,
  },
  cyclesBeforeLongBreak: {
    label: 'Ciclos de foco antes da pausa longa',
    description: 'Quantidade de sessões de foco concluídas antes de liberar a pausa longa.',
    recommendation: `Valor recomendado entre ${POMODORO_SETTINGS_LIMITS.cyclesBeforeLongBreak.min} e ${POMODORO_SETTINGS_LIMITS.cyclesBeforeLongBreak.max} ciclos.`,
  },
};

export function getPomodoroFieldHelperText(field: PomodoroNumericSettingsField): string {
  const guidance = POMODORO_SETTINGS_FIELD_GUIDANCE[field];
  return `${guidance.description} ${guidance.recommendation}`;
}
