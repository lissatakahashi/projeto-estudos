import { describe, expect, it, vi } from 'vitest';
import { createShopCatalogItem } from './createShopCatalogItem';

describe('createShopCatalogItem', () => {
  it('creates item with normalized payload', async () => {
    const createShopItem = vi.fn().mockResolvedValue({
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
        isActive: true,
        createdAt: '2026-04-21T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      },
      error: null,
    });

    const result = await createShopCatalogItem(
      { createShopItem },
      {
        name: 'Tema Aurora',
        slug: '',
        description: 'desc',
        price: 30,
        category: 'theme',
        rarity: 'rare',
        imageUrl: null,
        isActive: true,
      },
    );

    expect(result.ok).toBe(true);
    expect(createShopItem).toHaveBeenCalledWith(expect.objectContaining({ slug: 'tema-aurora' }));
  });

  it('rejects invalid price', async () => {
    const createShopItem = vi.fn();

    const result = await createShopCatalogItem(
      { createShopItem },
      {
        name: 'Tema Aurora',
        slug: 'tema-aurora',
        description: 'desc',
        price: -1,
        category: 'theme',
        rarity: 'rare',
        imageUrl: null,
        isActive: true,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.price).toBeTruthy();
    expect(createShopItem).not.toHaveBeenCalled();
  });
});
