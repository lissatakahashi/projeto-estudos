import type { UserPetState } from '../../domain/pet/types/pet';
import { normalizeLevel } from '../../domain/pet/types/pet';
import { supabase } from './client';

export type PetServiceError = {
  message: string;
  originalError?: unknown;
};

type PetRpcRow = {
  user_id: string;
  pet_name: string;
  pet_type: string;
  hunger_level: number;
  mood_level: number;
  last_fed_at: string | null;
  created_at: string;
  updated_at: string;
};

type FeedPetRpcRow = {
  success: boolean;
  reason: string;
  new_balance: number;
  fed_at: string | null;
  cooldown_remaining_seconds: number;
  pet: PetRpcRow;
};

function mapPetRow(row: PetRpcRow): UserPetState {
  return {
    userId: row.user_id,
    petName: row.pet_name,
    petType: row.pet_type as UserPetState['petType'],
    hungerLevel: normalizeLevel(row.hunger_level),
    moodLevel: normalizeLevel(row.mood_level),
    lastFedAt: row.last_fed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrCreateUserPetState(): Promise<{
  data: UserPetState | null;
  error: PetServiceError | null;
}> {
  try {
    const { data, error } = await (supabase as any).rpc('get_or_create_user_pet_state');

    if (error) {
      return { data: null, error: { message: 'Erro ao carregar estado do pet.', originalError: error } };
    }

    const row = (Array.isArray(data) ? data[0] : data) as unknown as PetRpcRow | undefined;

    if (!row) {
      return { data: null, error: { message: 'Resposta invalida ao carregar pet.' } };
    }

    return {
      data: mapPetRow(row),
      error: null,
    };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar pet.', originalError } };
  }
}

export async function feedUserPet(): Promise<{
  data: {
    success: boolean;
    reason: string;
    newBalance: number;
    fedAt: string | null;
    cooldownRemainingSeconds: number;
    pet: UserPetState | null;
  } | null;
  error: PetServiceError | null;
}> {
  try {
    const { data, error } = await (supabase as any).rpc('feed_user_pet');

    if (error) {
      return { data: null, error: { message: 'Erro ao alimentar pet.', originalError: error } };
    }

    const row = (Array.isArray(data) ? data[0] : data) as unknown as FeedPetRpcRow | undefined;

    if (!row) {
      return { data: null, error: { message: 'Resposta invalida ao alimentar pet.' } };
    }

    return {
      data: {
        success: Boolean(row.success),
        reason: row.reason,
        newBalance: Number(row.new_balance ?? 0),
        fedAt: row.fed_at,
        cooldownRemainingSeconds: Number(row.cooldown_remaining_seconds ?? 0),
        pet: row.pet ? mapPetRow(row.pet) : null,
      },
      error: null,
    };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao alimentar pet.', originalError } };
  }
}
