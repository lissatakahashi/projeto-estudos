import type { InventoryLoadResult } from '../types/shop';

export type FetchUserInventoryDeps = {
  listUserInventory: (userId: string) => Promise<{
    data: InventoryLoadResult['data'] | null;
    error: { message: string } | null;
  }>;
};

export async function fetchUserInventory(
  deps: FetchUserInventoryDeps,
  userId: string,
): Promise<InventoryLoadResult> {
  if (!userId) {
    return { data: [], status: 'error', totalItems: 0, error: 'Usuario nao autenticado.' };
  }

  const { data, error } = await deps.listUserInventory(userId);

  if (error) {
    return { data: [], status: 'error', totalItems: 0, error: error.message };
  }

  const items = data ?? [];

  return {
    data: items,
    status: items.length > 0 ? 'loaded' : 'empty',
    totalItems: items.length,
    error: null,
  };
}
