/**
 * PomodoroMode
 *
 * Descreve o modo de uma sessão Pomodoro.
 * - `focus`: período de trabalho (ex.: 25 minutos)
 * - `short_break`: pausa curta entre sessões de foco (ex.: 5 minutos)
 * - `long_break`: pausa longa após um conjunto de focos (ex.: 15 minutos)
 *
 * Use este tipo para rótulos de UI, padrões de temporizador e transições de estado.
 */
export type PomodoroMode = 'focus' | 'short_break' | 'long_break';
