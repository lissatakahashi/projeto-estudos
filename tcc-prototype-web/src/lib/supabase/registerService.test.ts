import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidRegisterPayload } from '../../domain/auth/types/register';

const {
  signUpMock,
  upsertMock,
  fromMock,
} = vi.hoisted(() => {
  const signUp = vi.fn();
  const upsert = vi.fn();
  const from = vi.fn(() => ({ upsert }));

  return {
    signUpMock: signUp,
    upsertMock: upsert,
    fromMock: from,
  };
});

vi.mock('./client', () => ({
  default: {
    auth: {
      signUp: signUpMock,
    },
    from: fromMock,
  },
}));

import { registerWithEmail } from './registerService';

const validPayload: ValidRegisterPayload = {
  fullName: 'Maria da Silva',
  birthDate: '1998-01-20',
  email: 'maria.silva@example.com',
  phone: '+5511999999999',
  password: 'Senha123',
  acceptLgpd: true,
};

describe('registerWithEmail', () => {
  beforeEach(() => {
    signUpMock.mockReset();
    upsertMock.mockReset();
    fromMock.mockClear();
  });

  it('deve criar conta e persistir perfil quando ha sessao imediata', async () => {
    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'user-123' },
        session: { access_token: 'token' },
      },
      error: null,
    });
    upsertMock.mockResolvedValue({ error: null });

    const result = await registerWithEmail(validPayload);

    expect(result.success).toBe(true);
    expect(result.requiresEmailConfirmation).toBe(false);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it('deve retornar sucesso exigindo confirmacao por e-mail quando nao ha sessao', async () => {
    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'user-456' },
        session: null,
      },
      error: null,
    });

    const result = await registerWithEmail(validPayload);

    expect(result.success).toBe(true);
    expect(result.requiresEmailConfirmation).toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
