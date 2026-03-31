import type { InventoryItem } from '../../domain/shop/types/shop';
import { supabase } from './client';
import { listUserInventory } from './shopService';
import type { Database } from './types';
import { getWalletByUserId, listWalletTransactions } from './walletService';

type FocusSessionRow = Pick<
  Database['public']['Tables']['pomodoroSessions']['Row'],
  | 'sessionId'
  | 'status'
  | 'phaseType'
  | 'startedAt'
  | 'endedAt'
  | 'completedAt'
  | 'plannedDurationSeconds'
  | 'actualDurationSeconds'
  | 'focusSequenceIndex'
  | 'cycleIndex'
  | 'createdAt'
>;

type WalletRow = Database['public']['Tables']['wallets']['Row'];
type WalletTransactionRow = Database['public']['Tables']['walletTransactions']['Row'];

export type DashboardRawData = {
  focusSessions: FocusSessionRow[];
  wallet: WalletRow | null;
  walletTransactions: WalletTransactionRow[];
  inventory: InventoryItem[];
};

export type DashboardServiceError = {
  message: string;
  originalError?: unknown;
};

export async function getDashboardRawData(userId: string): Promise<{
  data: DashboardRawData | null;
  error: DashboardServiceError | null;
}> {
  try {
    const [focusResult, walletResult, txResult, inventoryResult] = await Promise.all([
      supabase
        .from('pomodoroSessions')
        .select(
          'sessionId,status,phaseType,startedAt,endedAt,completedAt,plannedDurationSeconds,actualDurationSeconds,focusSequenceIndex,cycleIndex,createdAt',
        )
        .eq('userId', userId)
        .eq('phaseType', 'focus')
        .order('endedAt', { ascending: false }),
      getWalletByUserId(userId),
      listWalletTransactions(userId, 200),
      listUserInventory(userId),
    ]);

    if (focusResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar sessões de foco do dashboard.', originalError: focusResult.error },
      };
    }

    if (walletResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar carteira do dashboard.', originalError: walletResult.error },
      };
    }

    if (txResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar transações do dashboard.', originalError: txResult.error },
      };
    }

    if (inventoryResult.error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar inventário do dashboard.', originalError: inventoryResult.error },
      };
    }

    return {
      data: {
        focusSessions: (focusResult.data ?? []) as FocusSessionRow[],
        wallet: walletResult.data,
        walletTransactions: txResult.data ?? [],
        inventory: inventoryResult.data ?? [],
      },
      error: null,
    };
  } catch (originalError) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao carregar dados do dashboard.', originalError },
    };
  }
}
