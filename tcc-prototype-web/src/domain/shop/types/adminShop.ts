import type { ShopItem, ShopItemCategory, ShopItemRarity } from './shop';

export type ShopItemStatusFilter = 'all' | 'active' | 'inactive';

export type ShopItemSortOption = 'updated_desc' | 'updated_asc' | 'price_asc' | 'price_desc' | 'name_asc';

export type ShopItemFormValues = {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  rarity: ShopItemRarity;
  imageUrl: string | null;
  isActive: boolean;
};

export type CreateShopItemPayload = ShopItemFormValues;

export type UpdateShopItemPayload = {
  itemId: string;
} & ShopItemFormValues;

export type ShopItemsListResponse = {
  items: ShopItem[];
  total: number;
};

export type ShopItemFormFieldErrors = Partial<Record<keyof ShopItemFormValues, string>>;

export type ShopItemMutationResult = {
  ok: boolean;
  data: ShopItem | null;
  error: string | null;
  fieldErrors?: ShopItemFormFieldErrors;
};

export type ShopItemStatusMutationResult = {
  ok: boolean;
  data: ShopItem | null;
  error: string | null;
};
