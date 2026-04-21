import type { ShopItemStatusMutationResult } from '../types/adminShop';
import type { ShopItem } from '../types/shop';

type SetShopCatalogItemStatusDeps = {
  setShopItemStatus: (input: { itemId: string; isActive: boolean }) => Promise<{ data: ShopItem | null; error: { message: string } | null }>;
};

export async function setShopCatalogItemStatus(
  deps: SetShopCatalogItemStatusDeps,
  input: { itemId: string; isActive: boolean },
): Promise<ShopItemStatusMutationResult> {
  const { data, error } = await deps.setShopItemStatus(input);

  if (error || !data) {
    return {
      ok: false,
      data: null,
      error: error?.message ?? 'Nao foi possivel atualizar status do item.',
    };
  }

  return {
    ok: true,
    data,
    error: null,
  };
}
