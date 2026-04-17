import type { Pomodoro } from '../types';
import type { PomodoroCyclePhase } from '../types/PomodoroCycle';

const LOCKED_POMODORO_PHASES: ReadonlySet<PomodoroCyclePhase> = new Set([
  'focus',
  'short_break',
  'long_break',
  'paused',
]);

type PomodoroSettingsLockInput = {
  cyclePhase: PomodoroCyclePhase;
  activePomodoro: Pomodoro | null;
};

export function isPomodoroConfigLocked(input: PomodoroSettingsLockInput): boolean {
  if (input.activePomodoro && input.activePomodoro.status !== 'finished') {
    return true;
  }

  return LOCKED_POMODORO_PHASES.has(input.cyclePhase);
}

export function canEditPomodoroSettings(input: PomodoroSettingsLockInput): boolean {
  return !isPomodoroConfigLocked(input);
}

export const POMODORO_SETTINGS_LOCK_REASON =
  'Finalize ou reinicie a sessao atual para alterar a configuracao.';
