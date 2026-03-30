import { describe, expect, it, vi } from 'vitest';
import { feedPet } from './feedPet';

describe('feedPet', () => {
  it('feeds pet with successful persistence result', async () => {
    const deps = {
      feedUserPet: vi.fn().mockResolvedValue({
        data: {
          success: true,
          reason: 'fed',
          newBalance: 25,
          fedAt: '2026-03-29T11:10:00.000Z',
          cooldownRemainingSeconds: 0,
          pet: {
            userId: 'user-1',
            petName: 'Coruja Foco',
            petType: 'owl',
            hungerLevel: 95,
            moodLevel: 72,
            lastFedAt: '2026-03-29T11:10:00.000Z',
            createdAt: '2026-03-29T10:00:00.000Z',
            updatedAt: '2026-03-29T11:10:00.000Z',
          },
        },
        error: null,
      }),
    };

    const result = await feedPet(deps, { userId: 'user-1' });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('fed');
    expect(result.newBalance).toBe(25);
    expect(result.pet?.hungerLevel).toBe(95);
  });

  it('returns insufficient balance from backend decision', async () => {
    const deps = {
      feedUserPet: vi.fn().mockResolvedValue({
        data: {
          success: false,
          reason: 'insufficient_balance',
          newBalance: 2,
          fedAt: null,
          cooldownRemainingSeconds: 0,
          pet: null,
        },
        error: null,
      }),
    };

    const result = await feedPet(deps, { userId: 'user-1' });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_balance');
    expect(result.newBalance).toBe(2);
  });

  it('returns cooldown reason when feed action is blocked by cooldown window', async () => {
    const deps = {
      feedUserPet: vi.fn().mockResolvedValue({
        data: {
          success: false,
          reason: 'cooldown_active',
          newBalance: 30,
          fedAt: '2026-03-29T11:10:00.000Z',
          cooldownRemainingSeconds: 43,
          pet: null,
        },
        error: null,
      }),
    };

    const result = await feedPet(deps, { userId: 'user-1' });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('cooldown_active');
    expect(result.cooldownRemainingSeconds).toBe(43);
  });
});
