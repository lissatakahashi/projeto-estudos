import {
    POMODORO_STUDY_ACTIVITY_LIMITS,
    type PomodoroStudyActivityFormData,
    type PomodoroStudyActivityFormErrors,
    type PomodoroStudyActivityValidationResult,
} from '../types/PomodoroStudyActivity';

function normalizeFreeText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function validatePomodoroStudyActivity(
  draft: PomodoroStudyActivityFormData,
): PomodoroStudyActivityValidationResult {
  const errors: PomodoroStudyActivityFormErrors = {};

  const studyGoal = normalizeFreeText(draft.studyGoal);
  const studySubject = normalizeFreeText(draft.studySubject);

  if (studyGoal.length < POMODORO_STUDY_ACTIVITY_LIMITS.studyGoal.min) {
    errors.studyGoal = `Descreva um objetivo com ao menos ${POMODORO_STUDY_ACTIVITY_LIMITS.studyGoal.min} caracteres.`;
  } else if (studyGoal.length > POMODORO_STUDY_ACTIVITY_LIMITS.studyGoal.max) {
    errors.studyGoal = `Objetivo deve ter no máximo ${POMODORO_STUDY_ACTIVITY_LIMITS.studyGoal.max} caracteres.`;
  }

  if (studySubject.length > POMODORO_STUDY_ACTIVITY_LIMITS.studySubject.max) {
    errors.studySubject = `Conteúdo deve ter no máximo ${POMODORO_STUDY_ACTIVITY_LIMITS.studySubject.max} caracteres.`;
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: {},
    normalized: {
      studyGoal,
      studySubject: studySubject || undefined,
    },
  };
}
