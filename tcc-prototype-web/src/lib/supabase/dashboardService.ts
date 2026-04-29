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
  | 'studyGoal'
  | 'studySubject'
  | 'createdAt'
>;

type LegacyFocusSessionRow = Omit<FocusSessionRow, 'studyGoal' | 'studySubject'>;

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

const DASHBOARD_FOCUS_BASE_SELECT =
  'sessionId,status,phaseType,startedAt,endedAt,completedAt,plannedDurationSeconds,actualDurationSeconds,focusSequenceIndex,cycleIndex,createdAt';

const DASHBOARD_FOCUS_WITH_STUDY_SELECT = `${DASHBOARD_FOCUS_BASE_SELECT},studyGoal,studySubject`;

function isMissingStudyActivityColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  const code = maybeError.code ?? '';
  const combinedMessage = `${maybeError.message ?? ''} ${maybeError.details ?? ''} ${maybeError.hint ?? ''}`.toLowerCase();
  const mentionsStudyColumns = combinedMessage.includes('studygoal') || combinedMessage.includes('studysubject');

  if (!mentionsStudyColumns) {
    return false;
  }

  return code === '42703' || code === 'PGRST204' || combinedMessage.includes('column') || combinedMessage.includes('schema cache');
}

function normalizeFocusSessions(rows: Array<FocusSessionRow | LegacyFocusSessionRow>): FocusSessionRow[] {
  return rows.map((row) => {
    const withStudy = row as FocusSessionRow;

    return {
      ...row,
      studyGoal: 'studyGoal' in row ? withStudy.studyGoal ?? null : null,
      studySubject: 'studySubject' in row ? withStudy.studySubject ?? null : null,
    };
  });
}

async function listFocusSessions(userId: string, includeStudyColumns: boolean): Promise<{
  data: Array<FocusSessionRow | LegacyFocusSessionRow> | null;
  error: unknown | null;
}> {
  const selectClause = includeStudyColumns ? DASHBOARD_FOCUS_WITH_STUDY_SELECT : DASHBOARD_FOCUS_BASE_SELECT;

  const result = await supabase
    .from('pomodoroSessions')
    .select(selectClause)
    .eq('userId', userId)
    .eq('phaseType', 'focus')
    .order('endedAt', { ascending: false });

  return {
    data: (result.data as Array<FocusSessionRow | LegacyFocusSessionRow> | null) ?? null,
    error: result.error,
  };
}

export async function getDashboardRawData(userId: string): Promise<{
  data: DashboardRawData | null;
  error: DashboardServiceError | null;
}> {
  try {
    const supportDataPromise = Promise.all([
      getWalletByUserId(userId),
      listWalletTransactions(userId, 200),
      listUserInventory(userId),
    ]);

    let focusResult = await listFocusSessions(userId, true);

    if (focusResult.error && isMissingStudyActivityColumnError(focusResult.error)) {
      focusResult = await listFocusSessions(userId, false);
    }

    const [walletResult, txResult, inventoryResult] = await supportDataPromise;

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
        focusSessions: normalizeFocusSessions(focusResult.data ?? []),
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
