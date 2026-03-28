import create from 'zustand';
import type {
  InventoryCollectionStatus,
  InventoryItem,
  ShopItem,
  ShopPurchaseResult,
} from '../domain/shop/types/shop';
import { fetchActiveShopCatalog } from '../domain/shop/usecases/fetchActiveShopCatalog';
import { fetchUserInventory } from '../domain/shop/usecases/fetchUserInventory';
import { purchaseShopItem } from '../domain/shop/usecases/purchaseShopItem';
import { supabase } from '../lib/supabase/client';
import {
  listActiveShopItems,
  listUserInventory,
  purchaseShopItem as purchaseShopItemService,
} from '../lib/supabase/shopService';
import { useWalletStore } from './useWalletStore';

type ShopFeedback = {
  severity: 'success' | 'error' | 'info';
  message: string;
};

type ShopState = {
  userId: string | null;
  items: ShopItem[];
  inventory: InventoryItem[];
  inventoryStatus: InventoryCollectionStatus;
  loadingCatalog: boolean;
  loadingInventory: boolean;
  pendingPurchaseByItemId: Record<string, boolean>;
  error: string | null;
  feedback: ShopFeedback | null;
  setUserId: (userId: string | null) => void;
  loadCatalog: () => Promise<void>;
  loadInventory: () => Promise<void>;
  purchaseItem: (itemId: string) => Promise<ShopPurchaseResult>;
  clearFeedback: () => void;
  isOwned: (itemId: string) => boolean;
};

const defaultPurchaseResult: ShopPurchaseResult = {
  purchased: false,
  reason: 'integrity_error',
  newBalance: 0,
  transactionId: null,
  inventoryEntryId: null,
  purchaseId: null,
};

export const useShopStore = create<ShopState>((set, get) => ({
  userId: null,
  items: [],
  inventory: [],
  inventoryStatus: 'idle',
  loadingCatalog: false,
  loadingInventory: false,
  pendingPurchaseByItemId: {},
  error: null,
  feedback: null,

  setUserId: (userId) => {
    set({ userId, error: null });
    refreshInventoryRealtimeSubscription(userId);

    void get().loadCatalog();

    if (!userId) {
      set({ inventory: [], inventoryStatus: 'idle', pendingPurchaseByItemId: {} });
      return;
    }

    void get().loadInventory();
  },

  loadCatalog: async () => {
    set({ loadingCatalog: true, error: null });

    const result = await fetchActiveShopCatalog({
      listActiveShopItems,
    });

    set({
      items: result.data,
      loadingCatalog: false,
      error: result.error,
    });
  },

  loadInventory: async () => {
    const { userId } = get();

    if (!userId) {
      set({ inventory: [], inventoryStatus: 'idle', loadingInventory: false });
      return;
    }

    set({ loadingInventory: true, inventoryStatus: 'loading', error: null });

    const result = await fetchUserInventory(
      {
        listUserInventory,
      },
      userId,
    );

    set({
      inventory: result.data,
      inventoryStatus: result.status,
      loadingInventory: false,
      error: result.error,
    });

    if (result.error) {
      set({ inventoryStatus: 'error' });
    }
  },

  purchaseItem: async (itemId) => {
    const { userId, pendingPurchaseByItemId } = get();

    if (pendingPurchaseByItemId[itemId]) {
      return {
        ...defaultPurchaseResult,
        reason: 'in_progress',
      };
    }

    set((state) => ({
      pendingPurchaseByItemId: {
        ...state.pendingPurchaseByItemId,
        [itemId]: true,
      },
      feedback: null,
      error: null,
    }));

    const result = await purchaseShopItem(
      {
        purchaseShopItem: purchaseShopItemService,
      },
      {
        userId,
        itemId,
      },
    );

    set((state) => {
      const nextPending = { ...state.pendingPurchaseByItemId };
      delete nextPending[itemId];

      return {
        pendingPurchaseByItemId: nextPending,
      };
    });

    if (result.purchased) {
      useWalletStore.getState().setBalance(result.newBalance);
      void useWalletStore.getState().loadWallet();
      void get().loadInventory();

      set({
        feedback: {
          severity: 'success',
          message: 'Compra concluida com sucesso. Item adicionado ao inventario.',
        },
      });

      return result;
    }

    if (result.reason === 'in_progress') {
      set({
        feedback: {
          severity: 'info',
          message: 'Compra ja em processamento para este item.',
        },
      });
      return result;
    }

    if (result.reason === 'unauthorized') {
      set({
        feedback: {
          severity: 'error',
          message: 'Voce precisa entrar na conta para comprar itens.',
        },
      });
      return result;
    }

    if (result.reason === 'insufficient_balance') {
      set({
        feedback: {
          severity: 'error',
          message: 'Saldo insuficiente para esta compra.',
        },
      });
      return result;
    }

    if (result.reason === 'already_owned') {
      void get().loadInventory();
      set({
        feedback: {
          severity: 'info',
          message: 'Este item ja faz parte do seu inventario.',
        },
      });
      return result;
    }

    if (result.reason === 'item_unavailable') {
      void get().loadCatalog();
      set({
        feedback: {
          severity: 'error',
          message: 'Este item nao esta disponivel para compra.',
        },
      });
      return result;
    }

    set({
      feedback: {
        severity: 'error',
        message: 'Nao foi possivel concluir a compra. Tente novamente.',
      },
    });

    return result;
  },

  clearFeedback: () => {
    set({ feedback: null });
  },

  isOwned: (itemId) => get().inventory.some((entry) => entry.itemId === itemId),
}));

type RealtimeChannelLike = {
  on: (event: string, filter: Record<string, unknown>, callback: () => void) => RealtimeChannelLike;
  subscribe: () => unknown;
};

let inventoryRealtimeChannel: RealtimeChannelLike | null = null;

function refreshInventoryRealtimeSubscription(userId: string | null): void {
  if (inventoryRealtimeChannel) {
    void supabase.removeChannel(inventoryRealtimeChannel as never);
    inventoryRealtimeChannel = null;
  }

  if (!userId || typeof supabase.channel !== 'function') {
    return;
  }

  const channel = supabase
    .channel(`shop-inventory-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'userInventory',
        filter: `userId=eq.${userId}`,
      },
      () => {
        void useShopStore.getState().loadInventory();
      },
    );

  channel.subscribe();
  inventoryRealtimeChannel = channel as unknown as RealtimeChannelLike;
}

supabase.auth.onAuthStateChange((_event, session) => {
  useShopStore.getState().setUserId(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  useShopStore.getState().setUserId(data.session?.user?.id ?? null);
});
