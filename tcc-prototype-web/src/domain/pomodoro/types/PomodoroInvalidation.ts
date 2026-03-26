export const POMODORO_INVALIDATION_REASONS = [
  'manual_cancel',
  'route_change',
  'page_unload',
  'component_unmount',
  'tab_hidden_timeout',
] as const;

export type PomodoroInvalidationReason = (typeof POMODORO_INVALIDATION_REASONS)[number];

export function getPomodoroInvalidationReasonLabel(reason?: PomodoroInvalidationReason): string {
  if (!reason) return 'motivo nao informado';

  if (reason === 'manual_cancel') return 'cancelamento manual';
  if (reason === 'route_change') return 'troca de rota';
  if (reason === 'page_unload') return 'fechamento ou recarregamento da pagina';
  if (reason === 'component_unmount') return 'saida da tela ativa';
  return 'aba oculta por tempo excessivo';
}
