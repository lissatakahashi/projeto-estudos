import create from 'zustand';
import type {
    Badge,
    BadgeEvaluationEventType,
    BadgeEvaluationResult,
    UserBadge,
} from '../domain/badges/types/badge';
import { evaluateAndGrantUserBadges } from '../domain/badges/usecases/evaluateAndGrantUserBadges';
import { resolveFeedbackMessage } from '../domain/feedback/catalog';
import {
    getBadgeProgressSnapshot,
    grantBadgesToUser,
    listActiveBadges,
    listUserBadges,
} from '../lib/supabase/badgeService';
import { supabase } from '../lib/supabase/client';
import { useMotivationalFeedbackStore } from './useMotivationalFeedbackStore';

type BadgeStoreState = {
  userId: string | null;
  badges: Badge[];
  userBadges: UserBadge[];
  loading: boolean;
  evaluating: boolean;
  error: string | null;
  setUserId: (userId: string | null) => void;
  loadBadges: () => Promise<void>;
  evaluateAndGrantBadges: (eventType: BadgeEvaluationEventType) => Promise<BadgeEvaluationResult | null>;
  clearError: () => void;
};

function publishUnlockedBadgeFeedback(userBadge: UserBadge): void {
  const message = resolveFeedbackMessage('badge_unlocked', {
    badgeName: userBadge.badge.name,
  });

  useMotivationalFeedbackStore.getState().publish(message, {
    dedupeKey: `badge_unlocked:${userBadge.badge.slug}:${userBadge.userId}`,
    dedupeWindowMs: 1200,
  });
}

export const useBadgeStore = create<BadgeStoreState>((set, get) => ({
  userId: null,
  badges: [],
  userBadges: [],
  loading: false,
  evaluating: false,
  error: null,

  setUserId: (userId) => {
    set({ userId, error: null });

    if (!userId) {
      set({ badges: [], userBadges: [], loading: false, evaluating: false });
      return;
    }

    void get().loadBadges();
  },

  loadBadges: async () => {
    const { userId } = get();

    if (!userId) {
      set({ badges: [], userBadges: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    const [badgesResult, userBadgesResult] = await Promise.all([
      listActiveBadges(),
      listUserBadges(userId),
    ]);

    if (badgesResult.error || !badgesResult.data) {
      set({ loading: false, error: badgesResult.error?.message ?? 'Erro ao carregar badges.' });
      return;
    }

    if (userBadgesResult.error || !userBadgesResult.data) {
      set({ loading: false, error: userBadgesResult.error?.message ?? 'Erro ao carregar badges do usuario.' });
      return;
    }

    set({
      badges: badgesResult.data,
      userBadges: userBadgesResult.data,
      loading: false,
      error: null,
    });
  },

  evaluateAndGrantBadges: async (eventType) => {
    const { userId, evaluating } = get();

    if (!userId || evaluating) {
      return null;
    }

    set({ evaluating: true, error: null });

    const result = await evaluateAndGrantUserBadges(
      {
        listActiveBadges,
        listUserBadges,
        getBadgeProgressSnapshot,
        grantBadgesToUser,
      },
      {
        type: eventType,
        userId,
      },
    );

    if (result.error || !result.data) {
      set({ evaluating: false, error: result.error?.message ?? 'Erro ao avaliar badges.' });
      return null;
    }

    if (result.data.newlyEarned.length > 0) {
      result.data.newlyEarned.forEach((entry) => {
        publishUnlockedBadgeFeedback(entry);
      });
    }

    await get().loadBadges();
    set({ evaluating: false });

    return result.data;
  },

  clearError: () => {
    set({ error: null });
  },
}));

type RealtimeChannelLike = {
  on: (event: string, filter: Record<string, unknown>, callback: () => void) => RealtimeChannelLike;
  subscribe: () => unknown;
};

let badgeRealtimeChannel: RealtimeChannelLike | null = null;

function refreshBadgeRealtimeSubscription(userId: string | null): void {
  if (badgeRealtimeChannel) {
    void supabase.removeChannel(badgeRealtimeChannel as never);
    badgeRealtimeChannel = null;
  }

  if (!userId || typeof supabase.channel !== 'function') {
    return;
  }

  const channel = supabase
    .channel(`user-badges-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'userBadges',
        filter: `userId=eq.${userId}`,
      },
      () => {
        void useBadgeStore.getState().loadBadges();
      },
    );

  channel.subscribe();
  badgeRealtimeChannel = channel as unknown as RealtimeChannelLike;
}

supabase.auth.onAuthStateChange((_event, session) => {
  useBadgeStore.getState().setUserId(session?.user?.id ?? null);
  refreshBadgeRealtimeSubscription(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  useBadgeStore.getState().setUserId(data.session?.user?.id ?? null);
  refreshBadgeRealtimeSubscription(data.session?.user?.id ?? null);
});
