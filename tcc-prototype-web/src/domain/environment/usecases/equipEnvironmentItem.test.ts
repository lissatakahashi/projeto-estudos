import { describe, expect, it, vi } from 'vitest';
import { equipEnvironmentItem } from './equipEnvironmentItem';

describe('equipEnvironmentItem', () => {
  it('equips a valid inventory item in selected slot', async () => {
    const deps = {
      equipEnvironmentItem: vi.fn().mockResolvedValue({
        data: {
          success: true,
          reason: 'equipped',
          slotName: 'desk',
          inventoryEntryId: 'inv-1',
          itemId: 'item-1',
        },
        error: null,
      }),
    };

    const result = await equipEnvironmentItem(deps, {
      userId: 'user-1',
      slotName: 'desk',
      inventoryEntryId: 'inv-1',
    });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('equipped');
    expect(result.slotName).toBe('desk');
    expect(result.inventoryEntryId).toBe('inv-1');
  });

  it('returns already equipped elsewhere when backend blocks item reuse in another slot', async () => {
    const deps = {
      equipEnvironmentItem: vi.fn().mockResolvedValue({
        data: {
          success: false,
          reason: 'already_equipped_elsewhere',
          slotName: 'wall',
          inventoryEntryId: 'inv-1',
          itemId: 'item-1',
        },
        error: null,
      }),
    };

    const result = await equipEnvironmentItem(deps, {
      userId: 'user-1',
      slotName: 'wall',
      inventoryEntryId: 'inv-1',
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_equipped_elsewhere');
  });

  it('maps clear operation as successful slot replacement policy', async () => {
    const deps = {
      equipEnvironmentItem: vi.fn().mockResolvedValue({
        data: {
          success: true,
          reason: 'cleared',
          slotName: 'desk',
          inventoryEntryId: null,
          itemId: null,
        },
        error: null,
      }),
    };

    const result = await equipEnvironmentItem(deps, {
      userId: 'user-1',
      slotName: 'desk',
      inventoryEntryId: null,
    });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('cleared');
    expect(result.inventoryEntryId).toBeNull();
  });
});
