import type {
    InventoryApplyTarget,
    InventoryEquipSlot,
    InventoryItem,
    ShopItem,
} from '../../domain/shop/types/shop';
import { supabase } from './client';
import type { Database } from './types';

type ShopItemRow = Database['public']['Tables']['shopItems']['Row'];
type UserInventoryRow = Database['public']['Tables']['userInventory']['Row'];

type PurchaseShopItemRpcRow = {
  purchased: boolean;
  reason: string;
  new_balance: number;
  transaction_id: string | null;
  inventory_entry_id: string | null;
  purchase_id: string | null;
};

export type ShopServiceError = {
  message: string;
  originalError?: unknown;
};

function mapShopItemRow(row: ShopItemRow): ShopItem {
  return {
    itemId: row.itemId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category as ShopItem['category'],
    rarity: row.rarity as ShopItem['rarity'],
    environmentSlot: (row as Partial<ShopItemRow>).environmentSlot as ShopItem['environmentSlot'],
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listActiveShopItems(): Promise<{ data: ShopItem[] | null; error: ShopServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('shopItems')
      .select('*')
      .eq('isActive', true)
      .order('price', { ascending: true });

    if (error) {
      return { data: null, error: { message: 'Erro ao carregar catalogo da loja.', originalError: error } };
    }

    return { data: (data ?? []).map(mapShopItemRow), error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar catalogo.', originalError } };
  }
}

export async function listUserInventory(
  userId: string,
): Promise<{ data: InventoryItem[] | null; error: ShopServiceError | null }> {
  try {
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from('userInventory')
      .select('*')
      .eq('userId', userId)
      .order('acquiredAt', { ascending: false });

    if (inventoryError) {
      return { data: null, error: { message: 'Erro ao carregar inventario.', originalError: inventoryError } };
    }

    if (!inventoryRows || inventoryRows.length === 0) {
      return { data: [], error: null };
    }

    const itemIds = inventoryRows.map((row) => row.itemId);

    const { data: itemRows, error: itemError } = await supabase
      .from('shopItems')
      .select('*')
      .in('itemId', itemIds);

    if (itemError) {
      return { data: null, error: { message: 'Erro ao carregar detalhes dos itens do inventario.', originalError: itemError } };
    }

    const itemById = new Map<string, ShopItem>((itemRows ?? []).map((row) => [row.itemId, mapShopItemRow(row)]));

    const inventory: InventoryItem[] = (inventoryRows as UserInventoryRow[])
      .map((entry) => {
        const item = itemById.get(entry.itemId);
        if (!item) {
          return null;
        }

        return {
          inventoryEntryId: entry.inventoryEntryId,
          userId: entry.userId,
          itemId: entry.itemId,
          quantity: entry.quantity,
          isEquipped: Boolean((entry as Partial<UserInventoryRow>).isEquipped ?? false),
          equipSlot: ((entry as Partial<UserInventoryRow>).equipSlot ?? null) as InventoryEquipSlot | null,
          appliedTarget: ((entry as Partial<UserInventoryRow>).appliedTarget ?? null) as InventoryApplyTarget | null,
          createdAt: (entry as Partial<UserInventoryRow>).createdAt ?? entry.acquiredAt,
          acquiredAt: entry.acquiredAt,
          updatedAt: entry.updatedAt,
          purchaseId: entry.purchaseId,
          walletTransactionId: entry.walletTransactionId,
          item,
          isReadyForCustomization: Boolean(item.isActive),
        };
      })
      .filter((entry): entry is InventoryItem => Boolean(entry));

    return { data: inventory, error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar inventario.', originalError } };
  }
}

export async function purchaseShopItem(input: {
  itemId: string;
}): Promise<{
  data: {
    purchased: boolean;
    reason: string;
    newBalance: number;
    transactionId: string | null;
    inventoryEntryId: string | null;
    purchaseId: string | null;
  } | null;
  error: ShopServiceError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('purchase_shop_item', {
      p_item_id: input.itemId,
    });

    if (error) {
      return { data: null, error: { message: 'Erro ao processar compra na loja.', originalError: error } };
    }

    const row = (Array.isArray(data) ? data[0] : data) as PurchaseShopItemRpcRow | undefined;
    if (!row) {
      return { data: null, error: { message: 'Resposta invalida da compra na loja.' } };
    }

    return {
      data: {
        purchased: Boolean(row.purchased),
        reason: row.reason,
        newBalance: Number(row.new_balance ?? 0),
        transactionId: row.transaction_id,
        inventoryEntryId: row.inventory_entry_id,
        purchaseId: row.purchase_id,
      },
      error: null,
    };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao comprar item.', originalError } };
  }
}
