import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in development');
  }
  // In production we warn and allow the app to boot; runtime calls will likely fail.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are not set — supabase client may not work correctly.');
}

export const supabase = createClient<Database>(String(url ?? ''), String(anonKey ?? ''), {
  realtime: { params: { eventsPerSecond: 10 } },
});

export default supabase;
