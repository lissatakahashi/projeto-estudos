export const POMODORO_STUDY_ACTIVITY_LIMITS = {
  studyGoal: {
    min: 3,
    max: 120,
  },
  studySubject: {
    max: 160,
  },
} as const;

export type PomodoroStudyActivityMetadata = {
  studyGoal: string;
  studySubject?: string;
};

export type PomodoroStudyActivityFormData = {
  studyGoal: string;
  studySubject: string;
};

export type PomodoroStudyActivityFormErrors = Partial<Record<keyof PomodoroStudyActivityFormData, string>>;

export type PomodoroStudyActivityValidationResult = {
  isValid: boolean;
  errors: PomodoroStudyActivityFormErrors;
  normalized?: PomodoroStudyActivityMetadata;
};
