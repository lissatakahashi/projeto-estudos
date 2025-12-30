import supabase from './client';
import type { Pomodoros } from './types';

export async function getPomodoros(userId: string) {
  // cast supabase to any to avoid complex generics from the generated types
  const { data, error } = await (supabase as any).from('pomodoros').select('*').eq('userId', userId).order('createdAt', { ascending: false });
  return { data: data as Pomodoros[] | null, error };
}

export async function insertPomodoro(payload: Partial<Pomodoros>) {
  const { data, error } = await (supabase as any).from('pomodoros').insert([payload]).select().single();
  return { data: data as Pomodoros | null, error };
}

export async function updatePomodoro(pomodoroId: string, changes: Partial<Pomodoros>) {
  const { data, error } = await (supabase as any).from('pomodoros').update(changes).eq('pomodoroId', pomodoroId).select().single();
  return { data: data as Pomodoros | null, error };
}

export async function deletePomodoro(pomodoroId: string) {
  const { data, error } = await (supabase as any).from('pomodoros').delete().eq('pomodoroId', pomodoroId);
  return { data, error };
}
