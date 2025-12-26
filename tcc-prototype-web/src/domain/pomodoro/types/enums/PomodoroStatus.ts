/**
 * PomodoroStatus
 *
 * Representa o estado de ciclo de vida de uma sessão Pomodoro.
 * - `idle`: sem sessão ativa
 * - `running`: sessão em andamento (temporizador contando)
 * - `paused`: sessão pausada pelo usuário
 * - `finished`: sessão finalizada
 *
 * A store e a UI usam este status para controlar temporizadores e ações disponíveis.
 */
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'finished';
