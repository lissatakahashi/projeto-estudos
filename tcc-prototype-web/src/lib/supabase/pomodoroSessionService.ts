import type { PomodoroMode } from '../../domain/pomodoro/types/enums/PomodoroMode';
import type { PomodoroInvalidationReason } from '../../domain/pomodoro/types/PomodoroInvalidation';
import type {
    PomodoroCompletionTrigger,
    PomodoroSessionStatus,
} from '../../domain/pomodoro/usecases/focusSessionCompletion';
import { supabase } from './client';
import type { Database, Json } from './types';

type PomodoroSessionRow = Database['public']['Tables']['pomodoroSessions']['Row'];
type PomodoroSessionInsert = Database['public']['Tables']['pomodoroSessions']['Insert'];

export type RegisterFocusSessionInput = {
  userId: string;
  sourcePomodoroId: string;
  phaseType: PomodoroMode;
  startedAt: string;
  endedAt: string;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  status: PomodoroSessionStatus;
  focusSequenceIndex: number;
  cycleIndex: number;
  trigger: PomodoroCompletionTrigger;
  isValid: boolean;
  invalidReason?: PomodoroInvalidationReason;
};

export type PomodoroSessionServiceError = {
  message: string;
  originalError?: unknown;
};

export function mapFocusSessionToInsert(input: RegisterFocusSessionInput): PomodoroSessionInsert {
  const completedAt = input.status === 'completed' ? input.endedAt : null;

  return {
    userId: input.userId,
    sourcePomodoroId: input.sourcePomodoroId,
    phaseType: input.phaseType,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    plannedDurationSeconds: input.plannedDurationSeconds,
    actualDurationSeconds: input.actualDurationSeconds,
    status: input.status,
    completedAt,
    focusSequenceIndex: input.focusSequenceIndex,
    cycleIndex: input.cycleIndex,
    metadata: {
      trigger: input.trigger,
      isValid: input.isValid,
      invalidReason: input.invalidReason ?? null,
    } as unknown as Json,
  };
}

export async function registerFocusSession(
  input: RegisterFocusSessionInput,
): Promise<{ data: PomodoroSessionRow | null; error: PomodoroSessionServiceError | null }> {
  try {
    const payload = mapFocusSessionToInsert(input);

    const { data, error } = await supabase
      .from('pomodoroSessions')
      .upsert(payload, { onConflict: 'sourcePomodoroId' })
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: { message: 'Erro ao registrar sessao Pomodoro.', originalError: error },
      };
    }

    return { data, error: null };
  } catch (originalError) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao registrar sessao Pomodoro.', originalError },
    };
  }
}
