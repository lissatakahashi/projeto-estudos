import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  onAuthStateChangeMock,
  getSessionMock,
  channelMock,
  removeChannelMock,
  feedUserPetMock,
  getOrCreateUserPetStateMock,
  walletState,
  walletSetBalanceMock,
  walletLoadWalletMock,
  evaluateAndGrantBadgesMock,
  motivationalPublishMock,
  resolveFeedbackMessageMock,
} = vi.hoisted(() => {
  const onAuthStateChange = vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  }));
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
  const channel = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }));
  const removeChannel = vi.fn();

  const feedUserPet = vi.fn();
  const getOrCreateUserPetState = vi.fn().mockResolvedValue({ data: null, error: null });

  const wallet = {
    balance: 0,
  };
  const setBalance = vi.fn();
  const loadWallet = vi.fn();
  const evaluateAndGrantBadges = vi.fn();
  const publish = vi.fn();
  const resolveFeedbackMessage = vi.fn().mockReturnValue({
    message: 'Pet alimentado com sucesso.',
  });

  return {
    onAuthStateChangeMock: onAuthStateChange,
    getSessionMock: getSession,
    channelMock: channel,
    removeChannelMock: removeChannel,
    feedUserPetMock: feedUserPet,
    getOrCreateUserPetStateMock: getOrCreateUserPetState,
    walletState: wallet,
    walletSetBalanceMock: setBalance,
    walletLoadWalletMock: loadWallet,
    evaluateAndGrantBadgesMock: evaluateAndGrantBadges,
    motivationalPublishMock: publish,
    resolveFeedbackMessageMock: resolveFeedbackMessage,
  };
});

vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
    },
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

vi.mock('../lib/supabase/petService', () => ({
  feedUserPet: feedUserPetMock,
  getOrCreateUserPetState: getOrCreateUserPetStateMock,
}));

vi.mock('./useWalletStore', () => ({
  useWalletStore: {
    getState: () => ({
      balance: walletState.balance,
      setBalance: walletSetBalanceMock,
      loadWallet: walletLoadWalletMock,
    }),
  },
}));

vi.mock('./useBadgeStore', () => ({
  useBadgeStore: {
    getState: () => ({
      evaluateAndGrantBadges: evaluateAndGrantBadgesMock,
    }),
  },
}));

vi.mock('./useMotivationalFeedbackStore', () => ({
  useMotivationalFeedbackStore: {
    getState: () => ({
      publish: motivationalPublishMock,
    }),
  },
}));

vi.mock('../domain/feedback/catalog', () => ({
  resolveFeedbackMessage: resolveFeedbackMessageMock,
}));

import { usePetStore } from './usePetStore';

describe('usePetStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState.balance = 0;

    usePetStore.setState({
      userId: 'user-1',
      pet: {
        userId: 'user-1',
        petName: 'Coruja Foco',
        petType: 'owl',
        hungerLevel: 35,
        moodLevel: 50,
        lastFedAt: '2026-04-20T10:00:00.000Z',
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-20T10:00:00.000Z',
      },
      loading: false,
      feeding: false,
      error: null,
      feedback: null,
    });
  });

  it('blocks feeding locally when wallet balance is insufficient', async () => {
    walletState.balance = 2;

    const previousPet = usePetStore.getState().pet;
    const result = await usePetStore.getState().feedPet();

    expect(result.reason).toBe('insufficient_balance');
    expect(feedUserPetMock).not.toHaveBeenCalled();
    expect(usePetStore.getState().pet).toEqual(previousPet);
    expect(usePetStore.getState().feedback?.message).toMatch(/sem moedas suficientes/i);
    expect(usePetStore.getState().feedback?.message).toMatch(/Conclua sessoes de estudo/i);
    expect(walletSetBalanceMock).not.toHaveBeenCalled();
  });

  it('feeds pet normally when wallet balance is sufficient', async () => {
    walletState.balance = 20;
    feedUserPetMock.mockResolvedValue({
      data: {
        success: true,
        reason: 'fed',
        newBalance: 15,
        fedAt: '2026-04-23T11:10:00.000Z',
        cooldownRemainingSeconds: 0,
        pet: {
          userId: 'user-1',
          petName: 'Coruja Foco',
          petType: 'owl',
          hungerLevel: 90,
          moodLevel: 78,
          lastFedAt: '2026-04-23T11:10:00.000Z',
          createdAt: '2026-04-01T10:00:00.000Z',
          updatedAt: '2026-04-23T11:10:00.000Z',
        },
      },
      error: null,
    });

    const result = await usePetStore.getState().feedPet();

    expect(result.success).toBe(true);
    expect(feedUserPetMock).toHaveBeenCalledTimes(1);
    expect(usePetStore.getState().pet?.hungerLevel).toBe(90);
    expect(walletSetBalanceMock).toHaveBeenCalledWith(15);
    expect(walletLoadWalletMock).toHaveBeenCalledTimes(1);
    expect(usePetStore.getState().feedback?.severity).toBe('success');
    expect(motivationalPublishMock).toHaveBeenCalledTimes(1);
  });

  it('keeps pet unchanged and shows same guidance when backend returns insufficient balance', async () => {
    walletState.balance = 20;
    feedUserPetMock.mockResolvedValue({
      data: {
        success: false,
        reason: 'insufficient_balance',
        newBalance: 3,
        fedAt: null,
        cooldownRemainingSeconds: 0,
        pet: null,
      },
      error: null,
    });

    const previousPet = usePetStore.getState().pet;
    const result = await usePetStore.getState().feedPet();

    expect(result.reason).toBe('insufficient_balance');
    expect(usePetStore.getState().pet).toEqual(previousPet);
    expect(usePetStore.getState().feedback?.message).toMatch(/sem moedas suficientes/i);
    expect(usePetStore.getState().feedback?.message).toMatch(/Conclua sessoes de estudo/i);
    expect(walletSetBalanceMock).not.toHaveBeenCalled();
  });
});
