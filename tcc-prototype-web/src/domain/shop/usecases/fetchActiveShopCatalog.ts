import type { ShopItem } from '../types/shop';

export type FetchActiveShopCatalogDeps = {
  listActiveShopItems: () => Promise<{
    data: ShopItem[] | null;
    error: { message: string } | null;
  }>;
};

export async function fetchActiveShopCatalog(
  deps: FetchActiveShopCatalogDeps,
): Promise<{ data: ShopItem[]; error: string | null }> {
  const { data, error } = await deps.listActiveShopItems();

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}
