import { describe, expect, it } from 'vitest';
import { validatePomodoroStudyActivity } from './pomodoroStudyActivityValidation';

describe('validatePomodoroStudyActivity', () => {
  it('requires study goal with minimum length', () => {
    const result = validatePomodoroStudyActivity({
      studyGoal: '  a ',
      studySubject: 'Algoritmos',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.studyGoal).toContain('ao menos');
  });

  it('normalizes and returns metadata payload when valid', () => {
    const result = validatePomodoroStudyActivity({
      studyGoal: ' Revisar   capitulo 2 ',
      studySubject: '  Orientacao   a Objetos ',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalized).toEqual({
      studyGoal: 'Revisar capitulo 2',
      studySubject: 'Orientacao a Objetos',
    });
  });

  it('allows empty study subject as optional field', () => {
    const result = validatePomodoroStudyActivity({
      studyGoal: 'Resolver exercicios de recursao',
      studySubject: '  ',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalized).toEqual({
      studyGoal: 'Resolver exercicios de recursao',
      studySubject: undefined,
    });
  });
});
