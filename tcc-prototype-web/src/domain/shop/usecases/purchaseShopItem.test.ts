import { describe, expect, it, vi } from 'vitest';
import { purchaseShopItem } from './purchaseShopItem';

describe('purchaseShopItem use case', () => {
  it('returns purchased result with balance debit and inventory entry when user has sufficient balance', async () => {
    const deps = {
      purchaseShopItem: vi.fn().mockResolvedValue({
        data: {
          purchased: true,
          reason: 'purchased',
          newBalance: 80,
          transactionId: 'tx-1',
          inventoryEntryId: 'inv-1',
          purchaseId: 'purchase-1',
        },
        error: null,
      }),
    };

    const result = await purchaseShopItem(deps, {
      userId: 'user-1',
      itemId: 'item-1',
    });

    expect(result.purchased).toBe(true);
    expect(result.reason).toBe('purchased');
    expect(result.newBalance).toBe(80);
    expect(result.transactionId).toBe('tx-1');
    expect(result.inventoryEntryId).toBe('inv-1');
    expect(result.purchaseId).toBe('purchase-1');
  });

  it('blocks purchase when backend reports insufficient balance', async () => {
    const deps = {
      purchaseShopItem: vi.fn().mockResolvedValue({
        data: {
          purchased: false,
          reason: 'insufficient_balance',
          newBalance: 10,
          transactionId: null,
          inventoryEntryId: null,
          purchaseId: null,
        },
        error: null,
      }),
    };

    const result = await purchaseShopItem(deps, {
      userId: 'user-1',
      itemId: 'item-1',
    });

    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('insufficient_balance');
    expect(result.transactionId).toBeNull();
    expect(result.inventoryEntryId).toBeNull();
  });

  it('maps already owned item response without creating duplicate purchase', async () => {
    const deps = {
      purchaseShopItem: vi.fn().mockResolvedValue({
        data: {
          purchased: false,
          reason: 'already_owned',
          newBalance: 50,
          transactionId: null,
          inventoryEntryId: null,
          purchaseId: null,
        },
        error: null,
      }),
    };

    const result = await purchaseShopItem(deps, {
      userId: 'user-1',
      itemId: 'item-1',
    });

    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('already_owned');
    expect(result.newBalance).toBe(50);
  });

  it('returns integrity error when service fails', async () => {
    const deps = {
      purchaseShopItem: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'rpc failed' },
      }),
    };

    const result = await purchaseShopItem(deps, {
      userId: 'user-1',
      itemId: 'item-1',
    });

    expect(result.purchased).toBe(false);
    expect(result.reason).toBe('integrity_error');
  });
});
