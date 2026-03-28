import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  onAuthStateChangeMock,
  getSessionMock,
  listActiveShopItemsMock,
  listUserInventoryMock,
  purchaseShopItemMock,
  walletSetBalanceMock,
  walletLoadWalletMock,
} = vi.hoisted(() => {
  const onAuthStateChange = vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  }));
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });

  const listActiveShopItems = vi.fn().mockResolvedValue({ data: [], error: null });
  const listUserInventory = vi.fn().mockResolvedValue({ data: [], error: null });
  const purchaseShopItem = vi.fn();

  const setBalance = vi.fn();
  const loadWallet = vi.fn();

  return {
    onAuthStateChangeMock: onAuthStateChange,
    getSessionMock: getSession,
    listActiveShopItemsMock: listActiveShopItems,
    listUserInventoryMock: listUserInventory,
    purchaseShopItemMock: purchaseShopItem,
    walletSetBalanceMock: setBalance,
    walletLoadWalletMock: loadWallet,
  };
});

vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
    },
  },
}));

vi.mock('../lib/supabase/shopService', () => ({
  listActiveShopItems: listActiveShopItemsMock,
  listUserInventory: listUserInventoryMock,
  purchaseShopItem: purchaseShopItemMock,
}));

vi.mock('./useWalletStore', () => ({
  useWalletStore: {
    getState: () => ({
      setBalance: walletSetBalanceMock,
      loadWallet: walletLoadWalletMock,
    }),
  },
}));

import { useShopStore } from './useShopStore';

describe('useShopStore', () => {
  beforeEach(() => {
    purchaseShopItemMock.mockReset();
    listActiveShopItemsMock.mockClear();
    listUserInventoryMock.mockClear();
    walletSetBalanceMock.mockClear();
    walletLoadWalletMock.mockClear();

    useShopStore.setState({
      userId: 'user-1',
      items: [],
      inventory: [],
      inventoryStatus: 'idle',
      loadingCatalog: false,
      loadingInventory: false,
      pendingPurchaseByItemId: {},
      error: null,
      feedback: null,
    });
  });

  it('prevents duplicate purchase while the same item is already in progress', async () => {
    purchaseShopItemMock.mockImplementation(() => new Promise(() => {}));

    void useShopStore.getState().purchaseItem('item-1');

    const secondAttempt = await useShopStore.getState().purchaseItem('item-1');

    expect(secondAttempt.reason).toBe('in_progress');
    expect(purchaseShopItemMock).toHaveBeenCalledTimes(1);
  });

  it('updates wallet balance and sets success feedback after purchase', async () => {
    purchaseShopItemMock.mockResolvedValue({
      data: {
        purchased: true,
        reason: 'purchased',
        newBalance: 77,
        transactionId: 'tx-1',
        inventoryEntryId: 'inv-1',
        purchaseId: 'purchase-1',
      },
      error: null,
    });

    const result = await useShopStore.getState().purchaseItem('item-2');

    expect(result.purchased).toBe(true);
    expect(walletSetBalanceMock).toHaveBeenCalledWith(77);
    expect(walletLoadWalletMock).toHaveBeenCalledTimes(1);
    expect(listUserInventoryMock).toHaveBeenCalledWith('user-1');
    expect(useShopStore.getState().feedback?.severity).toBe('success');
    expect(useShopStore.getState().pendingPurchaseByItemId['item-2']).toBeUndefined();
  });
});
