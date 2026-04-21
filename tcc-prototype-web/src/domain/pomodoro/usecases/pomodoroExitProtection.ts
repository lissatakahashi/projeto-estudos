import type { Pomodoro } from '../types';

export const POMODORO_EXIT_CONFIRMATION_MESSAGE =
  'Existe uma sessão Pomodoro em andamento. Se você sair agora, o progresso em andamento pode ser perdido. Deseja realmente sair?';

export function isPomodoroProgressAtRisk(pomodoro: Pomodoro | null): boolean {
  return Boolean(pomodoro && pomodoro.status !== 'finished');
}
