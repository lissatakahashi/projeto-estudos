import create from 'zustand';
import {
    createEmptyEnvironmentConfiguration,
    ENVIRONMENT_SLOT_DEFINITIONS,
    ENVIRONMENT_SLOTS,
    isInventoryItemCompatibleWithSlot,
    type EnvironmentCollectionStatus,
    type EnvironmentSlotName,
    type EquipEnvironmentResult,
    type UserEnvironmentConfiguration,
} from '../domain/environment/types/environment';
import { equipEnvironmentItem } from '../domain/environment/usecases/equipEnvironmentItem';
import { fetchUserEnvironment } from '../domain/environment/usecases/fetchUserEnvironment';
import { resolveFeedbackMessage } from '../domain/feedback/catalog';
import { supabase } from '../lib/supabase/client';
import { equipEnvironmentItemRpc, listUserEnvironmentItems } from '../lib/supabase/environmentService';
import { useMotivationalFeedbackStore } from './useMotivationalFeedbackStore';
import { useShopStore } from './useShopStore';

type EnvironmentFeedback = {
  severity: 'success' | 'error' | 'info';
  message: string;
};

type EnvironmentState = {
  userId: string | null;
  configuration: UserEnvironmentConfiguration;
  status: EnvironmentCollectionStatus;
  loading: boolean;
  selectedSlot: EnvironmentSlotName | null;
  pendingBySlot: Record<EnvironmentSlotName, boolean>;
  error: string | null;
  feedback: EnvironmentFeedback | null;
  setUserId: (userId: string | null) => void;
  setSelectedSlot: (slotName: EnvironmentSlotName | null) => void;
  loadEnvironment: () => Promise<void>;
  equipSlotWithInventoryItem: (slotName: EnvironmentSlotName, inventoryEntryId: string) => Promise<EquipEnvironmentResult>;
  clearSlot: (slotName: EnvironmentSlotName) => Promise<EquipEnvironmentResult>;
  clearFeedback: () => void;
};

const buildPendingBySlot = (): Record<EnvironmentSlotName, boolean> => {
  return ENVIRONMENT_SLOTS.reduce<Record<EnvironmentSlotName, boolean>>((acc, slotName) => {
    acc[slotName] = false;
    return acc;
  }, {} as Record<EnvironmentSlotName, boolean>);
};

const defaultEquipResult = (slotName: EnvironmentSlotName): EquipEnvironmentResult => ({
  success: false,
  reason: 'integrity_error',
  slotName,
  inventoryEntryId: null,
  itemId: null,
});

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  userId: null,
  configuration: createEmptyEnvironmentConfiguration(),
  status: 'idle',
  loading: false,
  selectedSlot: null,
  pendingBySlot: buildPendingBySlot(),
  error: null,
  feedback: null,

  setUserId: (userId) => {
    set({ userId, error: null, feedback: null });
    refreshEnvironmentRealtimeSubscription(userId);

    if (!userId) {
      set({
        status: 'idle',
        configuration: createEmptyEnvironmentConfiguration(),
        selectedSlot: null,
        pendingBySlot: buildPendingBySlot(),
      });
      return;
    }

    void get().loadEnvironment();
  },

  setSelectedSlot: (slotName) => {
    set({ selectedSlot: slotName });
  },

  loadEnvironment: async () => {
    const userId = get().userId;

    if (!userId) {
      set({ status: 'idle', loading: false, configuration: createEmptyEnvironmentConfiguration() });
      return;
    }

    set({ loading: true, status: 'loading', error: null });

    const result = await fetchUserEnvironment(
      {
        listUserEnvironmentItems,
      },
      userId,
    );

    set({
      configuration: result.data,
      status: result.status,
      loading: false,
      error: result.error,
    });
  },

  equipSlotWithInventoryItem: async (slotName, inventoryEntryId) => {
    const { userId, pendingBySlot, configuration } = get();

    if (pendingBySlot[slotName]) {
      return {
        ...defaultEquipResult(slotName),
        reason: 'integrity_error',
      };
    }

    const inventory = useShopStore.getState().inventory;
    const inventoryEntry = inventory.find((entry) => entry.inventoryEntryId === inventoryEntryId);

    if (!inventoryEntry || inventoryEntry.userId !== userId) {
      set({
        feedback: { severity: 'error', message: 'Item nao encontrado no seu inventario.' },
      });
      return {
        ...defaultEquipResult(slotName),
        reason: 'item_not_owned',
      };
    }

    if (!isInventoryItemCompatibleWithSlot(inventoryEntry, slotName)) {
      set({
        feedback: { severity: 'error', message: 'Este item nao e compativel com o slot selecionado.' },
      });
      return {
        ...defaultEquipResult(slotName),
        reason: 'incompatible_slot',
      };
    }

    const alreadyEquippedInAnotherSlot = ENVIRONMENT_SLOTS.find((currentSlot) => {
      if (currentSlot === slotName) return false;
      return configuration.bySlot[currentSlot]?.inventoryEntryId === inventoryEntryId;
    });

    if (alreadyEquippedInAnotherSlot) {
      set({
        feedback: {
          severity: 'info',
          message: 'Este item ja esta equipado em outro slot. Remova-o primeiro para mover.',
        },
      });
      return {
        ...defaultEquipResult(slotName),
        reason: 'already_equipped_elsewhere',
      };
    }

    set((state) => ({
      pendingBySlot: {
        ...state.pendingBySlot,
        [slotName]: true,
      },
      feedback: null,
      error: null,
    }));

    const result = await equipEnvironmentItem(
      {
        equipEnvironmentItem: equipEnvironmentItemRpc,
      },
      {
        userId,
        slotName,
        inventoryEntryId,
      },
    );

    set((state) => ({
      pendingBySlot: {
        ...state.pendingBySlot,
        [slotName]: false,
      },
    }));

    if (result.success) {
      void get().loadEnvironment();

      const slotLabel = ENVIRONMENT_SLOT_DEFINITIONS.find((slot) => slot.slotName === slotName)?.label ?? slotName;
      const motivational = resolveFeedbackMessage('environment_item_equipped', {
        itemName: inventoryEntry.item.name,
        slotLabel,
      });
      useMotivationalFeedbackStore.getState().publish(motivational, {
        dedupeKey: `environment_item_equipped:${slotName}:${inventoryEntryId}`,
      });

      set({
        feedback: {
          severity: 'success',
          message: motivational.message,
        },
      });
      return result;
    }

    if (result.reason === 'item_not_owned') {
      void useShopStore.getState().loadInventory();
      set({
        feedback: {
          severity: 'error',
          message: 'O item selecionado nao pertence ao seu inventario atual.',
        },
      });
      return result;
    }

    if (result.reason === 'incompatible_slot') {
      set({
        feedback: {
          severity: 'error',
          message: 'Slot e item sao incompativeis. Escolha outro item.',
        },
      });
      return result;
    }

    if (result.reason === 'already_equipped_elsewhere') {
      set({
        feedback: {
          severity: 'info',
          message: 'Este item ja esta equipado em outro slot do ambiente.',
        },
      });
      return result;
    }

    set({
      feedback: {
        severity: 'error',
        message: 'Nao foi possivel salvar a personalizacao. Tente novamente.',
      },
    });

    return result;
  },

  clearSlot: async (slotName) => {
    const { userId, pendingBySlot } = get();

    if (pendingBySlot[slotName]) {
      return {
        ...defaultEquipResult(slotName),
        reason: 'integrity_error',
      };
    }

    set((state) => ({
      pendingBySlot: {
        ...state.pendingBySlot,
        [slotName]: true,
      },
      feedback: null,
      error: null,
    }));

    const result = await equipEnvironmentItem(
      {
        equipEnvironmentItem: equipEnvironmentItemRpc,
      },
      {
        userId,
        slotName,
        inventoryEntryId: null,
      },
    );

    set((state) => ({
      pendingBySlot: {
        ...state.pendingBySlot,
        [slotName]: false,
      },
    }));

    if (result.success) {
      void get().loadEnvironment();
      set({
        feedback: {
          severity: 'success',
          message: 'Slot limpo com sucesso.',
        },
      });
      return result;
    }

    set({
      feedback: {
        severity: 'error',
        message: 'Nao foi possivel limpar o slot.',
      },
    });

    return result;
  },

  clearFeedback: () => {
    set({ feedback: null });
  },
}));

type RealtimeChannelLike = {
  on: (event: string, filter: Record<string, unknown>, callback: () => void) => RealtimeChannelLike;
  subscribe: () => unknown;
};

let environmentRealtimeChannel: RealtimeChannelLike | null = null;

function refreshEnvironmentRealtimeSubscription(userId: string | null): void {
  if (environmentRealtimeChannel) {
    void supabase.removeChannel(environmentRealtimeChannel as never);
    environmentRealtimeChannel = null;
  }

  if (!userId || typeof supabase.channel !== 'function') {
    return;
  }

  const channel = supabase
    .channel(`user-environment-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'userEnvironmentSlots',
        filter: `userId=eq.${userId}`,
      },
      () => {
        void useEnvironmentStore.getState().loadEnvironment();
      },
    );

  channel.subscribe();
  environmentRealtimeChannel = channel as unknown as RealtimeChannelLike;
}

supabase.auth.onAuthStateChange((_event, session) => {
  useEnvironmentStore.getState().setUserId(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  useEnvironmentStore.getState().setUserId(data.session?.user?.id ?? null);
});
