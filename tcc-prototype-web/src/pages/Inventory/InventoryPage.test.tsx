import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '../../domain/shop/types/shop';
import InventoryPage from './InventoryPage';

type ShopStoreState = {
  userId: string | null;
  inventory: InventoryItem[];
  inventoryStatus: 'idle' | 'loading' | 'empty' | 'loaded' | 'error';
  loadingInventory: boolean;
  error: string | null;
  loadInventory: () => Promise<void>;
};

const { useShopStoreMock } = vi.hoisted(() => ({
  useShopStoreMock: vi.fn(),
}));

vi.mock('../../state/useShopStore', () => ({
  useShopStore: (selector: (state: ShopStoreState) => unknown) => useShopStoreMock(selector),
}));

const loadInventoryMock = vi.fn().mockResolvedValue(undefined);

const baseState: ShopStoreState = {
  userId: 'user-1',
  inventory: [],
  inventoryStatus: 'empty',
  loadingInventory: false,
  error: null,
  loadInventory: loadInventoryMock,
};

function buildItem(): InventoryItem {
  return {
    inventoryEntryId: 'inv-1',
    userId: 'user-1',
    itemId: 'item-1',
    quantity: 1,
    isEquipped: false,
    equipSlot: 'environment',
    appliedTarget: 'environment',
    createdAt: '2026-03-27T12:00:00.000Z',
    acquiredAt: '2026-03-27T12:00:00.000Z',
    updatedAt: '2026-03-27T12:00:00.000Z',
    purchaseId: 'purchase-1',
    walletTransactionId: 'tx-1',
    isReadyForCustomization: true,
    item: {
      itemId: 'item-1',
      name: 'Tema Floresta Calma',
      slug: 'tema-floresta-calma',
      description: 'Tema visual para estudo.',
      price: 20,
      category: 'theme',
      rarity: 'common',
      imageUrl: 'https://example.com/theme.png',
      isActive: true,
      createdAt: '2026-03-27T12:00:00.000Z',
      updatedAt: '2026-03-27T12:00:00.000Z',
    },
  };
}

describe('InventoryPage', () => {
  beforeEach(() => {
    loadInventoryMock.mockClear();
    useShopStoreMock.mockImplementation((selector) => selector(baseState));
  });

  it('renders friendly empty state', () => {
    render(
      <BrowserRouter>
        <InventoryPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Inventário/i })).toBeTruthy();
    expect(screen.getByText(/Voce ainda nao possui itens/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Ir para loja/i })).toBeTruthy();
  });

  it('renders inventory item data when loaded', () => {
    const loadedState: ShopStoreState = {
      ...baseState,
      inventoryStatus: 'loaded',
      inventory: [buildItem()],
    };

    useShopStoreMock.mockImplementation((selector) => selector(loadedState));

    render(
      <BrowserRouter>
        <InventoryPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Tema Floresta Calma/i)).toBeTruthy();
    expect(screen.getByText(/Tema visual para estudo/i)).toBeTruthy();
    expect(screen.getByText(/Qtd: 1/i)).toBeTruthy();
    expect(screen.getByText(/pronto para uso futuro/i)).toBeTruthy();
  });
});
