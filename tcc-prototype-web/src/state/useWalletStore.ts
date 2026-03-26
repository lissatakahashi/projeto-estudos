import create from 'zustand';
import type {
    WalletReferenceType,
    WalletTransaction,
    WalletTransactionReason,
    WalletTransactionType,
} from '../domain/economy/types/wallet';
import { supabase } from '../lib/supabase/client';
import { getWalletByUserId, listWalletTransactions } from '../lib/supabase/walletService';

type WalletState = {
  userId: string | null;
  balance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  setUserId: (userId: string | null) => void;
  loadWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setBalance: (balance: number) => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  userId: null,
  balance: 0,
  transactions: [],
  loading: false,
  error: null,

  setUserId: (userId) => {
    set({ userId });
    if (!userId) {
      set({ balance: 0, transactions: [], error: null, loading: false });
      return;
    }
    void get().loadWallet();
  },

  loadWallet: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });

    const [walletResult, txResult] = await Promise.all([
      getWalletByUserId(userId),
      listWalletTransactions(userId, 30),
    ]);

    if (walletResult.error) {
      set({ loading: false, error: walletResult.error.message });
      return;
    }

    const mappedTransactions: WalletTransaction[] = (txResult.data ?? []).map((tx) => ({
      transactionId: tx.transactionId,
      userId: tx.userId,
      amount: tx.amount,
      transactionType: tx.transactionType as WalletTransactionType,
      reason: tx.reason as WalletTransactionReason,
      referenceType: tx.referenceType as WalletReferenceType,
      referenceId: tx.referenceId,
      description: tx.description,
      createdAt: tx.createdAt,
    }));

    set({
      balance: walletResult.data?.balance ?? 0,
      transactions: mappedTransactions,
      loading: false,
      error: txResult.error?.message ?? null,
    });
  },

  refreshBalance: async () => {
    const { userId } = get();
    if (!userId) return;
    const { data, error } = await getWalletByUserId(userId);
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ balance: data?.balance ?? 0 });
  },

  setBalance: (balance) => {
    set({ balance });
  },
}));

supabase.auth.onAuthStateChange((_event, session) => {
  useWalletStore.getState().setUserId(session?.user?.id ?? null);
});

void supabase.auth.getSession().then(({ data }) => {
  useWalletStore.getState().setUserId(data.session?.user?.id ?? null);
});
