import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidLoginPayload } from '../../domain/auth/types/login';

const {
  signInWithPasswordMock,
  rpcMock,
} = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
    rpc: rpcMock,
  },
}));

import { loginWithIdentifier } from './loginService';

const emailPayload: ValidLoginPayload = {
  identifier: {
    type: 'email',
    email: 'maria.silva@example.com',
  },
  password: 'Senha123',
};

const phonePayload: ValidLoginPayload = {
  identifier: {
    type: 'phone',
    phone: '+5511999999999',
  },
  password: 'Senha123',
};

describe('loginWithIdentifier', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    rpcMock.mockReset();
  });

  it('deve autenticar com e-mail valido e senha correta', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    const result = await loginWithIdentifier(emailPayload);

    expect(result.success).toBe(true);
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'maria.silva@example.com',
      password: 'Senha123',
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('deve autenticar com celular valido e senha correta', async () => {
    rpcMock.mockResolvedValue({ data: 'maria.silva@example.com', error: null });
    signInWithPasswordMock.mockResolvedValue({ error: null });

    const result = await loginWithIdentifier(phonePayload);

    expect(result.success).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('resolve_login_email_by_phone', { p_phone: '+5511999999999' });
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'maria.silva@example.com',
      password: 'Senha123',
    });
  });

  it('deve falhar quando celular nao for encontrado', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const result = await loginWithIdentifier(phonePayload);

    expect(result).toEqual({
      success: false,
      field: 'identifier',
      message: 'Celular nao cadastrado.',
    });
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it('deve falhar com senha incorreta', async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: {
        message: 'Invalid login credentials',
      },
    });

    const result = await loginWithIdentifier(emailPayload);

    expect(result).toEqual({
      success: false,
      field: 'password',
      message: 'E-mail nao encontrado ou senha incorreta.',
    });
  });
});
