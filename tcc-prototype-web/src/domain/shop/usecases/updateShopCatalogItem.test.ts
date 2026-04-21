import { describe, expect, it, vi } from 'vitest';
import { updateShopCatalogItem } from './updateShopCatalogItem';

describe('updateShopCatalogItem', () => {
  it('updates existing item', async () => {
    const updateShopItem = vi.fn().mockResolvedValue({
      data: {
        itemId: 'item-1',
        name: 'Tema Aurora V2',
        slug: 'tema-aurora-v2',
        description: 'desc',
        price: 45,
        category: 'theme',
        rarity: 'epic',
        environmentSlot: null,
        imageUrl: null,
        isActive: true,
        createdAt: '2026-04-21T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      },
      error: null,
    });

    const result = await updateShopCatalogItem(
      { updateShopItem },
      {
        itemId: 'item-1',
        name: 'Tema Aurora V2',
        slug: 'tema-aurora-v2',
        description: 'desc',
        price: 45,
        category: 'theme',
        rarity: 'epic',
        imageUrl: null,
        isActive: true,
      },
    );

    expect(result.ok).toBe(true);
    expect(updateShopItem).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'item-1' }));
  });
});
