import create from 'zustand';
import { resolveFeedbackMessage } from '../domain/feedback/catalog';
import { FEED_PET_COST_POLICY, derivePetMoodState, type FeedPetResult, type UserPetState } from '../domain/pet/types/pet';
import { feedPet } from '../domain/pet/usecases/feedPet';
import { fetchUserPetState } from '../domain/pet/usecases/fetchUserPetState';
import { supabase } from '../lib/supabase/client';
import { feedUserPet, getOrCreateUserPetState } from '../lib/supabase/petService';
import { useMotivationalFeedbackStore } from './useMotivationalFeedbackStore';
import { useWalletStore } from './useWalletStore';

type PetFeedback = {
  severity: 'success' | 'error' | 'info';
  message: string;
};

type PetState = {
  userId: string | null;
  pet: UserPetState | null;
  loading: boolean;
  feeding: boolean;
  error: string | null;
  feedback: PetFeedback | null;
  setUserId: (userId: string | null) => void;
  loadPetState: () => Promise<void>;
  feedPet: () => Promise<FeedPetResult>;
  clearFeedback: () => void;
};

const defaultFeedResult: FeedPetResult = {
  success: false,
  reason: 'integrity_error',
  newBalance: 0,
  fedAt: null,
  cooldownRemainingSeconds: 0,
  pet: null,
};

export const usePetStore = create<PetState>((set, get) => ({
  userId: null,
  pet: null,
  loading: false,
  feeding: false,
  error: null,
  feedback: null,

  setUserId: (userId) => {
    set({ userId, error: null, feedback: null });
    refreshPetRealtimeSubscription(userId);

    if (!userId) {
      set({
        pet: null,
        loading: false,
        feeding: false,
      });
      return;
    }

    void get().loadPetState();
  },

  loadPetState: async () => {
    const { userId } = get();

    if (!userId) {
      set({ pet: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    const result = await fetchUserPetState(
      {
        getOrCreateUserPetState,
      },
      userId,
    );

    set({
      pet: result.data,
      loading: false,
      error: result.error,
    });
  },

  feedPet: async () => {
    const { userId, feeding } = get();

    if (feeding) {
      return defaultFeedResult;
    }

    set({ feeding: true, feedback: null, error: null });

    const result = await feedPet(
      {
        feedUserPet,
      },
      { userId },
    );

    set({ feeding: false });

    if (result.pet) {
      set({ pet: result.pet });
    }

    if (result.success) {
      useWalletStore.getState().setBalance(result.newBalance);
      void useWalletStore.getState().loadWallet();

      const mood = result.pet ? derivePetMoodState(result.pet) : 'neutral';
      const motivational = resolveFeedbackMessage('pet_fed', {
        petMood: mood,
      });
      useMotivationalFeedbackStore.getState().publish(motivational, {
        dedupeKey: `pet_fed:${result.fedAt ?? Date.now().toString()}`,
      });

      set({
        feedback: {
          severity: 'success',
          message: motivational.message,
        },
      });

      return result;
    }

    if (result.reason === 'insufficient_balance') {
      set({
        feedback: {
          severity: 'error',
          message: `Saldo insuficiente. Alimentar custa ${FEED_PET_COST_POLICY.coins} moedas.`,
        },
      });
      return result;
    }

    if (result.reason === 'cooldown_active') {
      set({
        feedback: {
          severity: 'info',
          message: `Aguarde ${result.cooldownRemainingSeconds}s para alimentar novamente.`,
        },
      });
      return result;
    }

    if (result.reason === 'unauthorized') {
      set({
        feedback: {
          severity: 'error',
          message: 'Voce precisa entrar na conta para alimentar o pet.',
        },
      });
      return result;
    }

    set({
      feedback: {
        severity: 'error',
        message: 'Nao foi possivel alimentar o pet agora. Tente novamente.',
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

let petRealtimeChannel: RealtimeChannelLike | null = null;

function refreshPetRealtimeSubscription(userId: string | null): void {
  if (petRealtimeChannel) {
    void supabase.removeChannel(petRealtimeChannel as never);
    petRealtimeChannel = null;
  }

  if (!userId || typeof supabase.channel !== 'function') {
    return;
  }

  const channel = supabase
    .channel(`user-pet-state-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'userPetStates',
        filter: `userId=eq.${userId}`,
      },
      () => {
        void usePetStore.getState().loadPetState();
      },
    );

  channel.subscribe();
  petRealtimeChannel = channel as unknown as RealtimeChannelLike;
}

supabase.auth.onAuthStateChange((_event, session) => {
  usePetStore.getState().setUserId(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  usePetStore.getState().setUserId(data.session?.user?.id ?? null);
});
