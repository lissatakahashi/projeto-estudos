import { describe, expect, it, vi } from 'vitest';
import { fetchUserEnvironment } from './fetchUserEnvironment';

describe('fetchUserEnvironment', () => {
  it('returns empty slot configuration when user has no equipped items', async () => {
    const deps = {
      listUserEnvironmentItems: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const result = await fetchUserEnvironment(deps, 'user-1');

    expect(result.status).toBe('loaded');
    expect(result.error).toBeNull();
    expect(result.data.bySlot.background).toBeNull();
    expect(result.data.bySlot.desk).toBeNull();
  });

  it('maps persisted equipped items by slot', async () => {
    const deps = {
      listUserEnvironmentItems: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'env-1',
            userId: 'user-1',
            slotName: 'desk',
            inventoryEntryId: 'inv-1',
            itemId: 'item-1',
            equippedAt: '2026-03-29T10:00:00.000Z',
            createdAt: '2026-03-29T10:00:00.000Z',
            updatedAt: '2026-03-29T10:00:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const result = await fetchUserEnvironment(deps, 'user-1');

    expect(result.status).toBe('loaded');
    expect(result.data.bySlot.desk?.inventoryEntryId).toBe('inv-1');
    expect(result.data.bySlot.background).toBeNull();
  });
});
