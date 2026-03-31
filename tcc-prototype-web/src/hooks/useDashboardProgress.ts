import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardPayload } from '../domain/dashboard/types/dashboard';
import { buildUserProgressDashboard } from '../domain/dashboard/usecases/buildUserProgressDashboard';
import { supabase } from '../lib/supabase/client';
import { getDashboardRawData } from '../lib/supabase/dashboardService';

type UseDashboardProgressState = {
  data: DashboardPayload | null;
  loading: boolean;
  error: string | null;
};

type UseDashboardProgressResult = UseDashboardProgressState & {
  refresh: () => Promise<void>;
};

export function useDashboardProgress(userId: string | null): UseDashboardProgressResult {
  const [state, setState] = useState<UseDashboardProgressState>({
    data: null,
    loading: Boolean(userId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    const result = await getDashboardRawData(userId);

    if (result.error || !result.data) {
      setState({ data: null, loading: false, error: result.error?.message ?? 'Erro ao carregar dashboard.' });
      return;
    }

    setState({
      data: buildUserProgressDashboard(result.data),
      loading: false,
      error: null,
    });
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const channel = supabase
      .channel(`dashboard-progress-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoroSessions',
          filter: `userId=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `userId=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walletTransactions',
          filter: `userId=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'userInventory',
          filter: `userId=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  return useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      refresh,
    }),
    [refresh, state.data, state.error, state.loading],
  );
}
