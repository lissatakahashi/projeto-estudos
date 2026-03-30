import { describe, expect, it, vi } from 'vitest';
import { fetchUserPetState } from './fetchUserPetState';

describe('fetchUserPetState', () => {
  it('returns pet state for authenticated user', async () => {
    const deps = {
      getOrCreateUserPetState: vi.fn().mockResolvedValue({
        data: {
          userId: 'user-1',
          petName: 'Coruja Foco',
          petType: 'owl',
          hungerLevel: 70,
          moodLevel: 50,
          lastFedAt: null,
          createdAt: '2026-03-29T10:00:00.000Z',
          updatedAt: '2026-03-29T10:00:00.000Z',
        },
        error: null,
      }),
    };

    const result = await fetchUserPetState(deps, 'user-1');

    expect(result.error).toBeNull();
    expect(result.data?.petName).toBe('Coruja Foco');
    expect(result.data?.hungerLevel).toBe(70);
  });

  it('returns auth error when user is missing', async () => {
    const deps = {
      getOrCreateUserPetState: vi.fn(),
    };

    const result = await fetchUserPetState(deps, '');

    expect(result.error).toBe('Usuario nao autenticado.');
    expect(deps.getOrCreateUserPetState).not.toHaveBeenCalled();
  });
});
