import { describe, expect, it, vi } from 'vitest';
import { setShopCatalogItemStatus } from './setShopCatalogItemStatus';

describe('setShopCatalogItemStatus', () => {
  it('deactivates item successfully', async () => {
    const setShopItemStatus = vi.fn().mockResolvedValue({
      data: {
        itemId: 'item-1',
        name: 'Tema Aurora',
        slug: 'tema-aurora',
        description: 'desc',
        price: 30,
        category: 'theme',
        rarity: 'rare',
        environmentSlot: null,
        imageUrl: null,
        isActive: false,
        createdAt: '2026-04-21T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      },
      error: null,
    });

    const result = await setShopCatalogItemStatus(
      { setShopItemStatus },
      { itemId: 'item-1', isActive: false },
    );

    expect(result.ok).toBe(true);
    expect(setShopItemStatus).toHaveBeenCalledWith({ itemId: 'item-1', isActive: false });
  });
});
