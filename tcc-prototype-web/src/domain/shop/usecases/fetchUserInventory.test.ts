import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '../types/shop';
import { fetchUserInventory } from './fetchUserInventory';

const makeInventoryItem = (): InventoryItem => ({
  inventoryEntryId: 'inv-1',
  userId: 'user-1',
  itemId: 'item-1',
  quantity: 1,
  isEquipped: false,
  equipSlot: 'environment',
  appliedTarget: 'environment',
  createdAt: '2026-03-27T10:00:00.000Z',
  acquiredAt: '2026-03-27T10:00:00.000Z',
  updatedAt: '2026-03-27T10:00:00.000Z',
  purchaseId: 'purchase-1',
  walletTransactionId: 'tx-1',
  isReadyForCustomization: true,
  item: {
    itemId: 'item-1',
    name: 'Tema Floresta',
    slug: 'tema-floresta',
    description: 'Tema para ambiente.',
    price: 20,
    category: 'theme',
    rarity: 'common',
    imageUrl: null,
    isActive: true,
    createdAt: '2026-03-27T10:00:00.000Z',
    updatedAt: '2026-03-27T10:00:00.000Z',
  },
});

describe('fetchUserInventory', () => {
  it('returns empty state when user has no items', async () => {
    const deps = {
      listUserInventory: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const result = await fetchUserInventory(deps, 'user-1');

    expect(result.error).toBeNull();
    expect(result.status).toBe('empty');
    expect(result.totalItems).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('returns loaded state with enriched items', async () => {
    const deps = {
      listUserInventory: vi.fn().mockResolvedValue({ data: [makeInventoryItem()], error: null }),
    };

    const result = await fetchUserInventory(deps, 'user-1');

    expect(result.error).toBeNull();
    expect(result.status).toBe('loaded');
    expect(result.totalItems).toBe(1);
    expect(result.data[0].item.name).toBe('Tema Floresta');
    expect(result.data[0].isReadyForCustomization).toBe(true);
  });
});
