import type { InventoryItem } from '../types/shop';

export type FetchUserInventoryDeps = {
  listUserInventory: (userId: string) => Promise<{
    data: InventoryItem[] | null;
    error: { message: string } | null;
  }>;
};

export async function fetchUserInventory(
  deps: FetchUserInventoryDeps,
  userId: string,
): Promise<{ data: InventoryItem[]; error: string | null }> {
  if (!userId) {
    return { data: [], error: 'Usuario nao autenticado.' };
  }

  const { data, error } = await deps.listUserInventory(userId);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}
