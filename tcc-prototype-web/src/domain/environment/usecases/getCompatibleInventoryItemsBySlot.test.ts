import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '../../shop/types/shop';
import { getCompatibleInventoryItemsBySlot } from './getCompatibleInventoryItemsBySlot';

const makeInventoryItem = (
  overrides: Partial<InventoryItem> & { item: Partial<InventoryItem['item']> },
): InventoryItem => ({
  inventoryEntryId: overrides.inventoryEntryId ?? 'inv-1',
  userId: overrides.userId ?? 'user-1',
  itemId: overrides.itemId ?? 'item-1',
  quantity: overrides.quantity ?? 1,
  isEquipped: overrides.isEquipped ?? false,
  equipSlot: overrides.equipSlot ?? null,
  appliedTarget: overrides.appliedTarget ?? null,
  createdAt: overrides.createdAt ?? '2026-03-29T10:00:00.000Z',
  acquiredAt: overrides.acquiredAt ?? '2026-03-29T10:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-03-29T10:00:00.000Z',
  purchaseId: overrides.purchaseId ?? 'purchase-1',
  walletTransactionId: overrides.walletTransactionId ?? 'tx-1',
  isReadyForCustomization: overrides.isReadyForCustomization ?? true,
  item: {
    itemId: overrides.item.itemId ?? 'item-1',
    name: overrides.item.name ?? 'Tema Floresta',
    slug: overrides.item.slug ?? 'tema-floresta',
    description: overrides.item.description ?? 'Descricao',
    price: overrides.item.price ?? 20,
    category: overrides.item.category ?? 'theme',
    rarity: overrides.item.rarity ?? 'common',
    environmentSlot: overrides.item.environmentSlot,
    imageUrl: overrides.item.imageUrl ?? null,
    isActive: overrides.item.isActive ?? true,
    createdAt: overrides.item.createdAt ?? '2026-03-29T10:00:00.000Z',
    updatedAt: overrides.item.updatedAt ?? '2026-03-29T10:00:00.000Z',
  },
});

describe('getCompatibleInventoryItemsBySlot', () => {
  it('returns only inventory items compatible with selected slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({
        inventoryEntryId: 'inv-theme',
        item: { category: 'theme', environmentSlot: 'background' },
      }),
      makeInventoryItem({
        inventoryEntryId: 'inv-decor',
        item: { category: 'decor', environmentSlot: 'desk' },
      }),
    ];

    const compatible = getCompatibleInventoryItemsBySlot(inventory, 'background');

    expect(compatible).toHaveLength(1);
    expect(compatible[0].inventoryEntryId).toBe('inv-theme');
  });

  it('blocks item when its explicit environment slot does not match selected slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({
        inventoryEntryId: 'inv-1',
        item: { category: 'decor', environmentSlot: 'desk' },
      }),
    ];

    const compatible = getCompatibleInventoryItemsBySlot(inventory, 'wall');

    expect(compatible).toEqual([]);
  });
});
