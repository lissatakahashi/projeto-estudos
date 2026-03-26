import { supabase } from './client';
import type { Database } from './types';

type WalletRow = Database['public']['Tables']['wallets']['Row'];
type WalletTransactionRow = Database['public']['Tables']['walletTransactions']['Row'];

export type WalletServiceError = {
  message: string;
  originalError?: unknown;
};

export async function getWalletByUserId(
  userId: string,
): Promise<{ data: WalletRow | null; error: WalletServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: { message: 'Erro ao carregar carteira.', originalError: error } };
    }

    return { data, error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar carteira.', originalError } };
  }
}

export async function listWalletTransactions(
  userId: string,
  limit = 20,
): Promise<{ data: WalletTransactionRow[] | null; error: WalletServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('walletTransactions')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: { message: 'Erro ao carregar transacoes da carteira.', originalError: error } };
    }

    return { data, error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar transacoes.', originalError } };
  }
}

type AwardFocusSessionRewardRpcRow = {
  awarded: boolean;
  awardedAmount: number;
  newBalance: number;
  transactionId: string | null;
};

export async function awardFocusSessionReward(input: {
  focusSessionId: string;
  plannedDurationSeconds: number;
}): Promise<{ data: AwardFocusSessionRewardRpcRow | null; error: WalletServiceError | null }> {
  try {
    const { data, error } = await supabase.rpc('award_focus_session_coins', {
      p_focus_session_id: input.focusSessionId,
      p_planned_duration_seconds: input.plannedDurationSeconds,
    });

    if (error) {
      return { data: null, error: { message: 'Erro ao creditar recompensa da sessao.', originalError: error } };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return { data: null, error: { message: 'Resposta invalida ao creditar recompensa.' } };
    }

    return {
      data: {
        awarded: Boolean(row.awarded),
        awardedAmount: Number(row.awarded_amount ?? 0),
        newBalance: Number(row.new_balance ?? 0),
        transactionId: row.transaction_id,
      },
      error: null,
    };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao creditar recompensa.', originalError } };
  }
}
