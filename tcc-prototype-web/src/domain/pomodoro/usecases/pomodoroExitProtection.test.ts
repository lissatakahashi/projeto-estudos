import { describe, expect, it } from 'vitest';
import type { Pomodoro } from '../types';
import { isPomodoroProgressAtRisk } from './pomodoroExitProtection';

function createPomodoro(status: Pomodoro['status']): Pomodoro {
  return {
    pomodoroId: 'pomodoro-1',
    title: 'Foco',
    mode: 'focus',
    status,
    duration: 1500,
    remaining: 1200,
    isValid: true,
    lostFocusSeconds: 0,
    startedAt: '2026-01-01T10:00:00.000Z',
  };
}

describe('pomodoroExitProtection', () => {
  it('identifies risk when session is active', () => {
    expect(isPomodoroProgressAtRisk(createPomodoro('running'))).toBe(true);
    expect(isPomodoroProgressAtRisk(createPomodoro('paused'))).toBe(true);
  });

  it('does not identify risk when there is no active session', () => {
    expect(isPomodoroProgressAtRisk(createPomodoro('finished'))).toBe(false);
    expect(isPomodoroProgressAtRisk(null)).toBe(false);
  });
});
