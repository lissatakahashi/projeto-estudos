export const SHOP_ITEM_CATEGORIES = ['theme', 'avatar', 'badge', 'decor', 'other'] as const;
export type ShopItemCategory = (typeof SHOP_ITEM_CATEGORIES)[number];

export const SHOP_ITEM_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type ShopItemRarity = (typeof SHOP_ITEM_RARITIES)[number];

export const INVENTORY_EQUIP_SLOTS = ['environment', 'avatar', 'pet', 'badge'] as const;
export type InventoryEquipSlot = (typeof INVENTORY_EQUIP_SLOTS)[number];

export const INVENTORY_APPLY_TARGETS = ['environment', 'character', 'pet', 'none'] as const;
export type InventoryApplyTarget = (typeof INVENTORY_APPLY_TARGETS)[number];

export type ShopItem = {
  itemId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  rarity: ShopItemRarity;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryEntry = {
  inventoryEntryId: string;
  userId: string;
  itemId: string;
  quantity: number;
  isEquipped: boolean;
  equipSlot: InventoryEquipSlot | null;
  appliedTarget: InventoryApplyTarget | null;
  createdAt: string;
  acquiredAt: string;
  updatedAt: string;
  purchaseId: string;
  walletTransactionId: string;
};

export type InventoryItemWithCatalog = InventoryEntry & {
  item: ShopItem;
  isReadyForCustomization: boolean;
};

export type InventoryItem = InventoryItemWithCatalog;

export type InventoryCollectionStatus = 'idle' | 'loading' | 'empty' | 'loaded' | 'error';

export type InventoryLoadResult = {
  data: InventoryItem[];
  status: InventoryCollectionStatus;
  totalItems: number;
  error: string | null;
};

export type ShopPurchasePayload = {
  itemId: string;
};

export type ShopPurchaseReason =
  | 'purchased'
  | 'insufficient_balance'
  | 'already_owned'
  | 'item_unavailable'
  | 'integrity_error'
  | 'unauthorized'
  | 'in_progress';

export type ShopPurchaseResult = {
  purchased: boolean;
  reason: ShopPurchaseReason;
  newBalance: number;
  transactionId: string | null;
  inventoryEntryId: string | null;
  purchaseId: string | null;
};
