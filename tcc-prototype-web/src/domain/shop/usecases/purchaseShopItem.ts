import type { ShopPurchaseResult } from '../types/shop';

export type PurchaseShopItemDeps = {
  purchaseShopItem: (input: { itemId: string }) => Promise<{
    data: {
      purchased: boolean;
      reason: string;
      newBalance: number;
      transactionId: string | null;
      inventoryEntryId: string | null;
      purchaseId: string | null;
    } | null;
    error: { message: string } | null;
  }>;
};

export async function purchaseShopItem(
  deps: PurchaseShopItemDeps,
  input: { userId: string | null; itemId: string },
): Promise<ShopPurchaseResult> {
  if (!input.userId) {
    return {
      purchased: false,
      reason: 'unauthorized',
      newBalance: 0,
      transactionId: null,
      inventoryEntryId: null,
      purchaseId: null,
    };
  }

  const { data, error } = await deps.purchaseShopItem({ itemId: input.itemId });

  if (error || !data) {
    return {
      purchased: false,
      reason: 'integrity_error',
      newBalance: 0,
      transactionId: null,
      inventoryEntryId: null,
      purchaseId: null,
    };
  }

  const mappedReason = ((): ShopPurchaseResult['reason'] => {
    switch (data.reason) {
      case 'purchased':
      case 'insufficient_balance':
      case 'already_owned':
      case 'item_unavailable':
        return data.reason;
      default:
        return 'integrity_error';
    }
  })();

  return {
    purchased: data.purchased,
    reason: mappedReason,
    newBalance: data.newBalance,
    transactionId: data.transactionId,
    inventoryEntryId: data.inventoryEntryId,
    purchaseId: data.purchaseId,
  };
}
