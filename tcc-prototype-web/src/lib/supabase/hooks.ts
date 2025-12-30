import { useEffect, useState } from 'react';
import supabase from './client';
import type { PomodoroRow } from './types';
import type { Session } from '@supabase/supabase-js';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return session;
}

export function usePomodoroRealtime(onChange: (payload: { eventType: string; newRow?: PomodoroRow; oldRow?: PomodoroRow }) => void) {
  useEffect(() => {
    const channel = (supabase as any)
      .channel('public:pomodoros')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pomodoros' }, (payload: any) => {
        const eventType = payload.eventType ?? payload.type ?? 'unknown';
        onChange({ eventType, newRow: payload.new as PomodoroRow | undefined, oldRow: payload.old as PomodoroRow | undefined });
      })
      .subscribe();

    return () => {
      try {
        // newer SDKs return channel with unsubscribe
        (channel as any)?.unsubscribe?.();
        // older shapes
        (channel as any)?.remove?.();
      } catch (e) {
        // ignore
      }
    };
  }, [onChange]);
}
