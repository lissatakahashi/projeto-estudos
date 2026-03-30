import type { UserPetState } from '../types/pet';

export type FetchUserPetStateDeps = {
  getOrCreateUserPetState: () => Promise<{
    data: UserPetState | null;
    error: { message: string } | null;
  }>;
};

export type FetchUserPetStateResult = {
  data: UserPetState | null;
  error: string | null;
};

export async function fetchUserPetState(deps: FetchUserPetStateDeps, userId: string): Promise<FetchUserPetStateResult> {
  if (!userId) {
    return {
      data: null,
      error: 'Usuario nao autenticado.',
    };
  }

  const { data, error } = await deps.getOrCreateUserPetState();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data,
    error: null,
  };
}
