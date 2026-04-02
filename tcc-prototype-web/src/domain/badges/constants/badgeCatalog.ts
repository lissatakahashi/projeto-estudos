import type { BadgeCategory, SystemBadgeSlug } from '../types/badge';

export type SystemBadgeDefinition = {
  slug: SystemBadgeSlug;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
};

export const SYSTEM_BADGE_DEFINITIONS: readonly SystemBadgeDefinition[] = [
  {
    slug: 'first_focus_session',
    name: 'Primeiro Foco',
    description: 'Conclua sua primeira sessao de foco valida.',
    category: 'study',
    icon: 'timer',
  },
  {
    slug: 'four_focus_sessions',
    name: 'Ritmo Inicial',
    description: 'Conclua 4 sessoes de foco validas.',
    category: 'study',
    icon: 'military_tech',
  },
  {
    slug: 'ten_focus_sessions',
    name: 'Persistencia Academica',
    description: 'Conclua 10 sessoes de foco validas.',
    category: 'study',
    icon: 'emoji_events',
  },
  {
    slug: 'first_shop_purchase',
    name: 'Primeira Compra',
    description: 'Realize sua primeira compra na loja.',
    category: 'economy',
    icon: 'shopping_bag',
  },
  {
    slug: 'first_environment_item_equipped',
    name: 'Ambiente Personalizado',
    description: 'Equipe seu primeiro item no ambiente virtual.',
    category: 'customization',
    icon: 'palette',
  },
  {
    slug: 'first_pet_feed',
    name: 'Cuidado Inicial',
    description: 'Alimente o pet pela primeira vez.',
    category: 'pet',
    icon: 'pets',
  },
  {
    slug: 'wallet_balance_100',
    name: 'Reserva Estrategica',
    description: 'Acumule 100 moedas de saldo na carteira.',
    category: 'economy',
    icon: 'savings',
  },
] as const;
