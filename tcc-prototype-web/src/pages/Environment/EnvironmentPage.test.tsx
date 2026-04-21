import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyEnvironmentConfiguration, ENVIRONMENT_SLOTS, type EnvironmentSlotName, type EquippedEnvironmentItem } from '../../domain/environment/types/environment';
import type { UserPetState } from '../../domain/pet/types/pet';
import type { InventoryItem } from '../../domain/shop/types/shop';
import EnvironmentPage from './EnvironmentPage';

type ShopStoreState = {
  userId: string | null;
  inventory: InventoryItem[];
  inventoryStatus: 'idle' | 'loading' | 'empty' | 'loaded' | 'error';
  loadingInventory: boolean;
  loadInventory: () => Promise<void>;
};

type EnvironmentStoreState = {
  configuration: ReturnType<typeof createEmptyEnvironmentConfiguration>;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  loading: boolean;
  selectedSlot: EnvironmentSlotName | null;
  pendingBySlot: Record<EnvironmentSlotName, boolean>;
  error: string | null;
  feedback: { severity: 'success' | 'error' | 'info'; message: string } | null;
  setSelectedSlot: (slot: EnvironmentSlotName | null) => void;
  loadEnvironment: () => Promise<void>;
  equipSlotWithInventoryItem: (slot: EnvironmentSlotName, inventoryEntryId: string) => Promise<unknown>;
  clearSlot: (slot: EnvironmentSlotName) => Promise<unknown>;
  clearFeedback: () => void;
};

type PetStoreState = {
  pet: UserPetState | null;
  loading: boolean;
  loadPetState: () => Promise<void>;
};

const { useShopStoreMock, useEnvironmentStoreMock, usePetStoreMock } = vi.hoisted(() => ({
  useShopStoreMock: vi.fn(),
  useEnvironmentStoreMock: vi.fn(),
  usePetStoreMock: vi.fn(),
}));

vi.mock('../../state/useShopStore', () => ({
  useShopStore: (selector: (state: ShopStoreState) => unknown) => useShopStoreMock(selector),
}));

vi.mock('../../state/useEnvironmentStore', () => ({
  useEnvironmentStore: (selector: (state: EnvironmentStoreState) => unknown) => useEnvironmentStoreMock(selector),
}));

vi.mock('../../state/usePetStore', () => ({
  usePetStore: (selector: (state: PetStoreState) => unknown) => usePetStoreMock(selector),
}));

const loadInventoryMock = vi.fn().mockResolvedValue(undefined);
const loadEnvironmentMock = vi.fn().mockResolvedValue(undefined);
const loadPetStateMock = vi.fn().mockResolvedValue(undefined);
const setSelectedSlotMock = vi.fn();
const equipSlotMock = vi.fn().mockResolvedValue(undefined);
const clearSlotMock = vi.fn().mockResolvedValue(undefined);
const clearFeedbackMock = vi.fn();

const baseEnvironmentState: EnvironmentStoreState = {
  configuration: createEmptyEnvironmentConfiguration(),
  status: 'loaded',
  loading: false,
  selectedSlot: null,
  pendingBySlot: ENVIRONMENT_SLOTS.reduce<Record<EnvironmentSlotName, boolean>>((acc, slotName) => {
    acc[slotName] = false;
    return acc;
  }, {} as Record<EnvironmentSlotName, boolean>),
  error: null,
  feedback: null,
  setSelectedSlot: setSelectedSlotMock,
  loadEnvironment: loadEnvironmentMock,
  equipSlotWithInventoryItem: equipSlotMock,
  clearSlot: clearSlotMock,
  clearFeedback: clearFeedbackMock,
};

const baseShopState: ShopStoreState = {
  userId: 'user-1',
  inventory: [],
  inventoryStatus: 'loaded',
  loadingInventory: false,
  loadInventory: loadInventoryMock,
};

const basePetState: PetStoreState = {
  pet: {
    userId: 'user-1',
    petName: 'Coruja GuardiA',
    petType: 'owl',
    hungerLevel: 20,
    moodLevel: 80,
    lastFedAt: '2026-04-21T10:30:00.000Z',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-21T10:30:00.000Z',
  },
  loading: false,
  loadPetState: loadPetStateMock,
};

function buildInventoryItem(): InventoryItem {
  return {
    inventoryEntryId: 'inv-wall-1',
    userId: 'user-1',
    itemId: 'item-wall-1',
    quantity: 1,
    isEquipped: true,
    equipSlot: 'environment',
    appliedTarget: 'environment',
    createdAt: '2026-04-21T10:00:00.000Z',
    acquiredAt: '2026-04-21T10:00:00.000Z',
    updatedAt: '2026-04-21T10:00:00.000Z',
    purchaseId: 'purchase-1',
    walletTransactionId: 'tx-1',
    isReadyForCustomization: true,
    item: {
      itemId: 'item-wall-1',
      name: 'Quadro Foco Profundo',
      slug: 'quadro-foco-profundo',
      description: 'Quadro para parede com meta semanal.',
      price: 60,
      category: 'decor',
      rarity: 'rare',
      environmentSlot: 'wall',
      imageUrl: null,
      isActive: true,
      createdAt: '2026-04-21T10:00:00.000Z',
      updatedAt: '2026-04-21T10:00:00.000Z',
    },
  };
}

function buildWallEquippedItem(): EquippedEnvironmentItem {
  return {
    id: 'env-slot-1',
    userId: 'user-1',
    slotName: 'wall',
    inventoryEntryId: 'inv-wall-1',
    itemId: 'item-wall-1',
    equippedAt: '2026-04-21T10:00:00.000Z',
    createdAt: '2026-04-21T10:00:00.000Z',
    updatedAt: '2026-04-21T10:00:00.000Z',
  };
}

describe('EnvironmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useShopStoreMock.mockImplementation((selector) => selector(baseShopState));
    useEnvironmentStoreMock.mockImplementation((selector) => selector(baseEnvironmentState));
    usePetStoreMock.mockImplementation((selector) => selector(basePetState));
  });

  it('renders pet actor inside environment scene using real pet state', () => {
    render(
      <BrowserRouter>
        <EnvironmentPage />
      </BrowserRouter>,
    );

    const actor = screen.getByLabelText(/Personagem virtual dentro do ambiente/i);
    expect(actor).toBeTruthy();
    expect(within(actor).getByText('🦉')).toBeTruthy();
  });

  it('keeps environment items and slot rendering working with integrated pet', () => {
    const item = buildInventoryItem();
    const configuredState: EnvironmentStoreState = {
      ...baseEnvironmentState,
      configuration: {
        bySlot: {
          ...createEmptyEnvironmentConfiguration().bySlot,
          wall: buildWallEquippedItem(),
        },
      },
    };

    const shopState: ShopStoreState = {
      ...baseShopState,
      inventory: [item],
    };

    useEnvironmentStoreMock.mockImplementation((selector) => selector(configuredState));
    useShopStoreMock.mockImplementation((selector) => selector(shopState));

    render(
      <BrowserRouter>
        <EnvironmentPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('button', { name: /Selecionar posição Parede/i })).toBeTruthy();
    expect(screen.getByText(/Quadro Foco Profundo/i)).toBeTruthy();
  });
});
