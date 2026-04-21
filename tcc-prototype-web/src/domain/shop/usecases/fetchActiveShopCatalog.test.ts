import { describe, expect, it, vi } from 'vitest';
import { fetchActiveShopCatalog } from './fetchActiveShopCatalog';

describe('fetchActiveShopCatalog', () => {
  it('returns only active items provided by service layer', async () => {
    const listActiveShopItems = vi.fn().mockResolvedValue({
      data: [
        {
          itemId: 'item-1',
          name: 'Tema Ativo',
          slug: 'tema-ativo',
          description: 'desc',
          price: 10,
          category: 'theme',
          rarity: 'common',
          environmentSlot: null,
          imageUrl: null,
          isActive: true,
          createdAt: '2026-04-21T00:00:00.000Z',
          updatedAt: '2026-04-21T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const result = await fetchActiveShopCatalog({ listActiveShopItems });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].isActive).toBe(true);
  });
});
