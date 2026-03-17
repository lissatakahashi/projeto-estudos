import { describe, expect, it } from 'vitest';
import type { LoginFormValues } from '../types/login';
import { normalizeBrazilianPhone, parseAuthIdentifier } from './identifier';
import { validateLoginForm } from './loginValidation';

const basePayload: LoginFormValues = {
  identifier: 'maria.silva@example.com',
  password: 'Senha123',
};

describe('validateLoginForm', () => {
  it('falha quando os campos obrigatorios estao vazios', () => {
    const result = validateLoginForm({
      identifier: '',
      password: '',
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.identifier).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
  });

  it('retorna payload sanitizado para identificador e-mail valido', () => {
    const result = validateLoginForm({
      ...basePayload,
      identifier: '  MARIA.SILVA@EXAMPLE.COM ',
    });

    expect(result.errors).toEqual({});
    expect(result.sanitized).toEqual({
      identifier: {
        type: 'email',
        email: 'maria.silva@example.com',
      },
      password: 'Senha123',
    });
  });

  it('retorna payload sanitizado para identificador celular valido em formatos distintos', () => {
    const resultA = validateLoginForm({
      ...basePayload,
      identifier: '(45) 99999-8888',
    });
    const resultB = validateLoginForm({
      ...basePayload,
      identifier: '45999998888',
    });
    const resultC = validateLoginForm({
      ...basePayload,
      identifier: '+55 45 99999-8888',
    });

    expect(resultA.sanitized?.identifier).toEqual({ type: 'phone', phone: '+5545999998888' });
    expect(resultB.sanitized?.identifier).toEqual({ type: 'phone', phone: '+5545999998888' });
    expect(resultC.sanitized?.identifier).toEqual({ type: 'phone', phone: '+5545999998888' });
  });
});

describe('identifier helpers', () => {
  it('normaliza celular brasileiro para formato canonico', () => {
    expect(normalizeBrazilianPhone('(45) 99999-8888')).toBe('+5545999998888');
    expect(normalizeBrazilianPhone('45999998888')).toBe('+5545999998888');
    expect(normalizeBrazilianPhone('+55 45 99999-8888')).toBe('+5545999998888');
  });

  it('interpreta corretamente e-mail e celular', () => {
    expect(parseAuthIdentifier('maria.silva@example.com')).toEqual({
      type: 'email',
      email: 'maria.silva@example.com',
    });
    expect(parseAuthIdentifier('(11) 99999-9999')).toEqual({
      type: 'phone',
      phone: '+5511999999999',
    });
  });
});
