export const SHOP_ITEM_CATEGORIES = ['theme', 'avatar', 'badge', 'decor', 'other'] as const;
export type ShopItemCategory = (typeof SHOP_ITEM_CATEGORIES)[number];

export const SHOP_ITEM_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type ShopItemRarity = (typeof SHOP_ITEM_RARITIES)[number];

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
  acquiredAt: string;
  purchaseId: string;
  walletTransactionId: string;
};

export type InventoryItem = InventoryEntry & {
  item: ShopItem;
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
