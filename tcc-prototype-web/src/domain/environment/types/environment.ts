import type { InventoryItem, ShopItemCategory } from '../../shop/types/shop';

export const ENVIRONMENT_SLOTS = [
  'background',
  'desk',
  'wall',
  'floor',
  'decoration_left',
  'decoration_right',
  'shelf',
  'window_area',
] as const;

export type EnvironmentSlotName = (typeof ENVIRONMENT_SLOTS)[number];

export type EnvironmentSlotDefinition = {
  slotName: EnvironmentSlotName;
  label: string;
  description: string;
  acceptedItemCategories: ShopItemCategory[];
};

export type EquippedEnvironmentItem = {
  id: string;
  userId: string;
  slotName: EnvironmentSlotName;
  inventoryEntryId: string;
  itemId: string;
  equippedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UserEnvironmentConfiguration = {
  bySlot: Record<EnvironmentSlotName, EquippedEnvironmentItem | null>;
};

export type EnvironmentCollectionStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type EnvironmentLoadResult = {
  data: UserEnvironmentConfiguration;
  status: EnvironmentCollectionStatus;
  error: string | null;
};

export type EquipEnvironmentItemPayload = {
  slotName: EnvironmentSlotName;
  inventoryEntryId: string;
};

export type UnequipEnvironmentItemPayload = {
  slotName: EnvironmentSlotName;
};

export type EquipEnvironmentReason =
  | 'equipped'
  | 'cleared'
  | 'unauthorized'
  | 'item_not_owned'
  | 'incompatible_slot'
  | 'already_equipped_elsewhere'
  | 'integrity_error';

export type EquipEnvironmentResult = {
  success: boolean;
  reason: EquipEnvironmentReason;
  slotName: EnvironmentSlotName;
  inventoryEntryId: string | null;
  itemId: string | null;
};

export const ENVIRONMENT_SLOT_DEFINITIONS: EnvironmentSlotDefinition[] = [
  {
    slotName: 'background',
    label: 'Plano de fundo',
    description: 'Tema principal do ambiente de estudo.',
    acceptedItemCategories: ['theme'],
  },
  {
    slotName: 'desk',
    label: 'Mesa',
    description: 'Item principal sobre a mesa de estudos.',
    acceptedItemCategories: ['decor'],
  },
  {
    slotName: 'wall',
    label: 'Parede',
    description: 'Quadros, paineis e elementos de parede.',
    acceptedItemCategories: ['decor'],
  },
  {
    slotName: 'floor',
    label: 'Chão',
    description: 'Tapetes e elementos de piso.',
    acceptedItemCategories: ['decor'],
  },
  {
    slotName: 'decoration_left',
    label: 'Decoração esquerda',
    description: 'Item decorativo no lado esquerdo.',
    acceptedItemCategories: ['decor'],
  },
  {
    slotName: 'decoration_right',
    label: 'Decoração direita',
    description: 'Item decorativo no lado direito.',
    acceptedItemCategories: ['decor'],
  },
  {
    slotName: 'shelf',
    label: 'Prateleira',
    description: 'Objetos decorativos da prateleira.',
    acceptedItemCategories: ['decor', 'badge'],
  },
  {
    slotName: 'window_area',
    label: 'Janela',
    description: 'Itens visuais para a area da janela.',
    acceptedItemCategories: ['decor', 'theme'],
  },
];

const EMPTY_SLOT_CONFIGURATION = ENVIRONMENT_SLOTS.reduce<Record<EnvironmentSlotName, EquippedEnvironmentItem | null>>(
  (acc, slotName) => {
    acc[slotName] = null;
    return acc;
  },
  {} as Record<EnvironmentSlotName, EquippedEnvironmentItem | null>,
);

export function createEmptyEnvironmentConfiguration(): UserEnvironmentConfiguration {
  return {
    bySlot: { ...EMPTY_SLOT_CONFIGURATION },
  };
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function normalizeShopCategory(category: string): ShopItemCategory | string {
  const normalized = normalizeToken(category);

  if (normalized === 'tema') return 'theme';
  if (normalized === 'decoracao') return 'decor';
  if (normalized === 'emblema') return 'badge';
  if (normalized === 'outro') return 'other';

  return normalized;
}

function normalizeEnvironmentSlotName(slotName: string): EnvironmentSlotName | string {
  const normalized = normalizeToken(slotName);

  if (normalized === 'plano_de_fundo' || normalized === 'fundo') return 'background';
  if (normalized === 'parede') return 'wall';
  if (normalized === 'chao') return 'floor';
  if (normalized === 'decoracao_esquerda') return 'decoration_left';
  if (normalized === 'decoracao_direita') return 'decoration_right';
  if (normalized === 'janela') return 'window_area';

  return normalized;
}

export function isInventoryItemCompatibleWithSlot(
  item: Pick<InventoryItem, 'item'>,
  slotName: EnvironmentSlotName,
): boolean {
  const slotDefinition = ENVIRONMENT_SLOT_DEFINITIONS.find((slot) => slot.slotName === slotName);

  if (!slotDefinition) {
    return false;
  }

  const normalizedSelectedSlot = normalizeEnvironmentSlotName(slotName);
  const normalizedItemSlot = item.item.environmentSlot
    ? normalizeEnvironmentSlotName(item.item.environmentSlot)
    : null;

  if (normalizedItemSlot && normalizedItemSlot !== normalizedSelectedSlot) {
    return false;
  }

  const normalizedItemCategory = normalizeShopCategory(item.item.category);
  const acceptedCategories = slotDefinition.acceptedItemCategories.map(normalizeShopCategory);

  return acceptedCategories.includes(normalizedItemCategory);
}
