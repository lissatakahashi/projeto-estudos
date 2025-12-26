import { supabase } from './client';
import type { Pomodoro } from '../../domain/pomodoro/types';
import type { Database, Json } from './types';

/**
 * Serviço de integração com Supabase para operações de Pomodoro
 * 
 * Este arquivo centraliza todas as operações CRUD (Create, Read, Update, Delete)
 * relacionadas a pomodoros no banco de dados Supabase.
 */

// Tipos extraídos do schema do Supabase
type PomodoroRow = Database['public']['Tables']['pomodoros']['Row'];
type PomodoroInsert = Database['public']['Tables']['pomodoros']['Insert'];
type PomodoroUpdate = Database['public']['Tables']['pomodoros']['Update'];

// Estrutura do metadata JSONB
interface PomodoroMetadata {
    mode?: string;
    isValid?: boolean;
    invalidReason?: string;
    lostFocusSeconds?: number;
}

export interface PomodoroServiceError {
    message: string;
    originalError?: unknown;
}

/**
 * Lista todos os pomodoros de um usuário
 * @param userId - ID do usuário autenticado
 * @returns Array de pomodoros ou erro
 */
export async function listPomodoros(
    userId: string
): Promise<{ data: PomodoroRow[] | null; error: PomodoroServiceError | null }> {
    try {
        const { data, error } = await supabase
            .from('pomodoros')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (error) {
            return {
                data: null,
                error: { message: 'Erro ao listar pomodoros', originalError: error },
            };
        }

        return { data, error: null };
    } catch (err) {
        return {
            data: null,
            error: { message: 'Erro inesperado ao listar pomodoros', originalError: err },
        };
    }
}

/**
 * Cria um novo pomodoro
 * @param pomodoroData - Dados do pomodoro a ser criado
 * @returns Pomodoro criado ou erro
 */
export async function createPomodoro(
    pomodoroData: PomodoroInsert
): Promise<{ data: PomodoroRow | null; error: PomodoroServiceError | null }> {
    try {
        const { data, error } = await supabase
            .from('pomodoros')
            .insert([pomodoroData])
            .select()
            .single();

        if (error) {
            return {
                data: null,
                error: { message: 'Erro ao criar pomodoro', originalError: error },
            };
        }

        return { data, error: null };
    } catch (err) {
        return {
            data: null,
            error: { message: 'Erro inesperado ao criar pomodoro', originalError: err },
        };
    }
}

/**
 * Atualiza um pomodoro existente
 * @param pomodoroId - ID do pomodoro a ser atualizado
 * @param updates - Campos a serem atualizados
 * @returns Pomodoro atualizado ou erro
 */
export async function updatePomodoro(
    pomodoroId: string,
    updates: PomodoroUpdate
): Promise<{ data: PomodoroRow | null; error: PomodoroServiceError | null }> {
    try {
        const { data, error } = await supabase
            .from('pomodoros')
            .update(updates)
            .eq('pomodoroId', pomodoroId)
            .select()
            .single();

        if (error) {
            return {
                data: null,
                error: { message: 'Erro ao atualizar pomodoro', originalError: error },
            };
        }

        return { data, error: null };
    } catch (err) {
        return {
            data: null,
            error: { message: 'Erro inesperado ao atualizar pomodoro', originalError: err },
        };
    }
}

/**
 * Remove um pomodoro
 * @param pomodoroId - ID do pomodoro a ser removido
 * @returns Sucesso ou erro
 */
export async function deletePomodoro(
    pomodoroId: string
): Promise<{ error: PomodoroServiceError | null }> {
    try {
        const { error } = await supabase
            .from('pomodoros')
            .delete()
            .eq('pomodoroId', pomodoroId);

        if (error) {
            return {
                error: { message: 'Erro ao deletar pomodoro', originalError: error },
            };
        }

        return { error: null };
    } catch (err) {
        return {
            error: { message: 'Erro inesperado ao deletar pomodoro', originalError: err },
        };
    }
}

/**
 * Converte um PomodoroRow do Supabase para o tipo Pomodoro da aplicação
 */
export function mapRecordToPomodoro(record: PomodoroRow): Pomodoro {
    const duration = (record.durationMinutes ?? 25) * 60; // converter minutos para segundos, default 25min
    const startedAt = new Date(record.startedAt ?? new Date());
    const now = new Date();

    // Calcular tempo restante baseado no tempo decorrido
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const remaining = Math.max(0, duration - elapsedSeconds);

    // Type guard para metadata
    const metadata = record.metadata as PomodoroMetadata | null;

    return {
        pomodoroId: record.pomodoroId,
        title: record.title ?? 'Sessão Sem Título',
        mode: (metadata?.mode as Pomodoro['mode']) || 'focus',
        status: record.isComplete ? 'finished' : 'running',
        duration,
        remaining,
        isValid: metadata?.isValid ?? true,
        lostFocusSeconds: metadata?.lostFocusSeconds ?? 0,
        startedAt: record.startedAt ?? undefined,
        endedAt: record.endedAt ?? undefined,
        invalidReason: metadata?.invalidReason,
    };
}

/**
 * Converte um Pomodoro da aplicação para PomodoroInsert do Supabase
 */
export function mapPomodoroToRecord(
    pomodoro: Pomodoro,
    userId: string
): PomodoroInsert {
    return {
        userId,
        title: pomodoro.title,
        durationMinutes: Math.floor(pomodoro.duration / 60),
        startedAt: pomodoro.startedAt ?? new Date().toISOString(),
        endedAt: pomodoro.endedAt ?? null,
        isComplete: pomodoro.status === 'finished',
        // Type assertion para metadata pois Json é muito genérico
        metadata: {
            mode: pomodoro.mode,
            isValid: pomodoro.isValid,
            invalidReason: pomodoro.invalidReason,
            lostFocusSeconds: pomodoro.lostFocusSeconds,
        } as unknown as Json,
    };
}
