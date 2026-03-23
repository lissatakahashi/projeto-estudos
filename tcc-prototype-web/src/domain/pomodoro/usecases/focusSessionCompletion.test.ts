import { describe, expect, it } from 'vitest';
import { resolveFocusSessionCompletion } from './focusSessionCompletion';

describe('resolveFocusSessionCompletion', () => {
  it('marks a valid focus block finished by timer as completed and countable', () => {
    const result = resolveFocusSessionCompletion({
      mode: 'focus',
      isValid: true,
      plannedDurationSeconds: 1500,
      remainingSeconds: 0,
      trigger: 'timer_elapsed',
    });

    expect(result.status).toBe('completed');
    expect(result.shouldPersist).toBe(true);
    expect(result.shouldCountAsCompletedFocus).toBe(true);
    expect(result.actualDurationSeconds).toBe(1500);
  });

  it('treats timer_elapsed as completed even when remaining has stale residual seconds', () => {
    const result = resolveFocusSessionCompletion({
      mode: 'focus',
      isValid: true,
      plannedDurationSeconds: 1500,
      remainingSeconds: 1,
      trigger: 'timer_elapsed',
    });

    expect(result.status).toBe('completed');
    expect(result.shouldCountAsCompletedFocus).toBe(true);
  });

  it('marks invalid focus blocks as invalidated and not countable', () => {
    const result = resolveFocusSessionCompletion({
      mode: 'focus',
      isValid: false,
      plannedDurationSeconds: 1500,
      remainingSeconds: 120,
      trigger: 'timer_elapsed',
    });

    expect(result.status).toBe('invalidated');
    expect(result.shouldPersist).toBe(true);
    expect(result.shouldCountAsCompletedFocus).toBe(false);
    expect(result.actualDurationSeconds).toBe(1380);
  });

  it('marks manually advanced focus blocks as interrupted', () => {
    const result = resolveFocusSessionCompletion({
      mode: 'focus',
      isValid: true,
      plannedDurationSeconds: 1500,
      remainingSeconds: 300,
      trigger: 'manual_advance',
    });

    expect(result.status).toBe('interrupted');
    expect(result.shouldPersist).toBe(true);
    expect(result.shouldCountAsCompletedFocus).toBe(false);
    expect(result.actualDurationSeconds).toBe(1200);
  });

  it('does not persist non-focus phases as completed study sessions', () => {
    const result = resolveFocusSessionCompletion({
      mode: 'short_break',
      isValid: true,
      plannedDurationSeconds: 300,
      remainingSeconds: 0,
      trigger: 'timer_elapsed',
    });

    expect(result.shouldPersist).toBe(false);
    expect(result.shouldCountAsCompletedFocus).toBe(false);
  });
});
