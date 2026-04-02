import type {
  FeedbackVariant,
  MotivationalFeedbackEvent,
  MotivationalFeedbackPayload,
  ResolvedFeedbackMessage,
} from './types';

type CatalogEntry = {
  variant: FeedbackVariant;
  durationMs: number;
  templates: Array<(payload: MotivationalFeedbackPayload) => string>;
};

const feedbackCatalog: Record<MotivationalFeedbackEvent, CatalogEntry> = {
  pomodoro_started: {
    variant: 'motivational',
    durationMs: 3200,
    templates: [
      () => 'Sessão iniciada. Foque no próximo bloco e mantenha o ritmo.',
      () => 'Pomodoro em andamento. Um passo de cada vez no seu objetivo.',
    ],
  },
  pomodoro_completed: {
    variant: 'success',
    durationMs: 4200,
    templates: [
      () => 'Sessao concluida com sucesso. Excelente consistencia.',
      () => 'Bloco de foco finalizado. Seu progresso está evoluindo.',
    ],
  },
  pomodoro_invalidated: {
    variant: 'warning',
    durationMs: 5200,
    templates: [
      (payload) => `Sessao interrompida por ${payload.invalidReasonLabel ?? 'abandono'}. O progresso nao foi contabilizado.`,
      (payload) => `A sessão foi invalidada por ${payload.invalidReasonLabel ?? 'interrupcao'}. Sem contagem neste ciclo.`,
    ],
  },
  coins_earned: {
    variant: 'motivational',
    durationMs: 4200,
    templates: [
      (payload) => `Recompensa recebida: +${payload.coins ?? 0} moedas pelo seu foco.`,
      (payload) => `Você ganhou ${payload.coins ?? 0} moeda(s). Continue no ritmo de estudo.`,
    ],
  },
  badge_unlocked: {
    variant: 'success',
    durationMs: 5200,
    templates: [
      (payload) => `Nova conquista desbloqueada: ${payload.badgeName ?? 'Badge especial'}.`,
      (payload) => `Você ganhou a badge ${payload.badgeName ?? 'especial'}. Continue evoluindo.`,
    ],
  },
  shop_item_purchased: {
    variant: 'success',
    durationMs: 3800,
    templates: [
      (payload) => `Compra concluida: ${payload.itemName ?? 'item'} foi adicionado ao inventario.`,
      (payload) => `Novo recurso desbloqueado: ${payload.itemName ?? 'item'} agora esta no seu inventario.`,
    ],
  },
  environment_item_equipped: {
    variant: 'success',
    durationMs: 3600,
    templates: [
      (payload) => `${payload.itemName ?? 'Item'} equipado${payload.slotLabel ? ` no slot ${payload.slotLabel}` : ''}.`,
      (payload) => `Ambiente atualizado com ${payload.itemName ?? 'item'}. Boa personalização.`,
    ],
  },
  pet_fed: {
    variant: 'motivational',
    durationMs: 3600,
    templates: [
      (payload) => `Pet alimentado com sucesso. Humor atual: ${payload.petMood ?? 'estavel'}.`,
      () => 'Cuidado registrado. Seu pet acompanha sua jornada de estudos.',
    ],
  },
  dashboard_empty: {
    variant: 'info',
    durationMs: 4600,
    templates: [
      () => 'Seu dashboard está pronto. Conclua a primeira sessão para gerar progresso real.',
      () => 'Comece com um bloco de foco para liberar suas metricas de evolucao.',
    ],
  },
  first_achievement_unlocked: {
    variant: 'motivational',
    durationMs: 5200,
    templates: [
      (payload) => `Primeira conquista desbloqueada: ${payload.achievementLabel ?? 'Primeira sessao concluida'}.`,
      () => 'Marco inicial atingido. Continue para consolidar o habito de estudo.',
    ],
  },
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function chooseTemplate(
  event: MotivationalFeedbackEvent,
  payload: MotivationalFeedbackPayload,
  explicitSeed?: string,
): { template: (payload: MotivationalFeedbackPayload) => string; index: number } {
  const entry = feedbackCatalog[event];
  const seedBase = explicitSeed ?? `${event}:${JSON.stringify(payload)}`;
  const index = hashString(seedBase) % entry.templates.length;
  return { template: entry.templates[index], index };
}

export function resolveFeedbackMessage(
  event: MotivationalFeedbackEvent,
  payload: MotivationalFeedbackPayload = {},
  explicitSeed?: string,
): ResolvedFeedbackMessage {
  const entry = feedbackCatalog[event];
  const { template, index } = chooseTemplate(event, payload, explicitSeed);

  return {
    event,
    variant: entry.variant,
    message: template(payload),
    dedupeKey: `${event}:${index}:${JSON.stringify(payload)}`,
    durationMs: entry.durationMs,
  };
}
