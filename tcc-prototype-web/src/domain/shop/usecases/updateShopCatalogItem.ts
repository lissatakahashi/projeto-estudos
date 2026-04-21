import type { ShopItemMutationResult, UpdateShopItemPayload } from '../types/adminShop';
import type { ShopItem } from '../types/shop';
import { normalizeShopItemFormValues, validateShopItemFormValues } from '../validation/shopItemAdminValidation';

type UpdateShopCatalogItemDeps = {
  updateShopItem: (payload: UpdateShopItemPayload) => Promise<{ data: ShopItem | null; error: { message: string } | null }>;
};

export async function updateShopCatalogItem(
  deps: UpdateShopCatalogItemDeps,
  payload: UpdateShopItemPayload,
): Promise<ShopItemMutationResult> {
  const normalizedFormValues = normalizeShopItemFormValues(payload);
  const fieldErrors = validateShopItemFormValues(normalizedFormValues);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      data: null,
      error: 'Dados invalidos para atualizar item.',
      fieldErrors,
    };
  }

  const { data, error } = await deps.updateShopItem({
    ...normalizedFormValues,
    itemId: payload.itemId,
  });

  if (error || !data) {
    return {
      ok: false,
      data: null,
      error: error?.message ?? 'Nao foi possivel atualizar o item.',
    };
  }

  return {
    ok: true,
    data,
    error: null,
  };
}
