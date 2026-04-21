import type { CreateShopItemPayload, ShopItemMutationResult } from '../types/adminShop';
import type { ShopItem } from '../types/shop';
import { normalizeShopItemFormValues, validateShopItemFormValues } from '../validation/shopItemAdminValidation';

type CreateShopCatalogItemDeps = {
  createShopItem: (payload: CreateShopItemPayload) => Promise<{ data: ShopItem | null; error: { message: string } | null }>;
};

export async function createShopCatalogItem(
  deps: CreateShopCatalogItemDeps,
  payload: CreateShopItemPayload,
): Promise<ShopItemMutationResult> {
  const normalized = normalizeShopItemFormValues(payload);
  const fieldErrors = validateShopItemFormValues(normalized);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      data: null,
      error: 'Dados invalidos para criar item.',
      fieldErrors,
    };
  }

  const { data, error } = await deps.createShopItem(normalized);

  if (error || !data) {
    return {
      ok: false,
      data: null,
      error: error?.message ?? 'Nao foi possivel criar o item.',
    };
  }

  return {
    ok: true,
    data,
    error: null,
  };
}
