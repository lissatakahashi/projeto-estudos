import { describe, expect, it } from 'vitest';
import type { RegisterFormValues } from '../types/register';
import { validateRegisterForm } from './registerValidation';

const basePayload: RegisterFormValues = {
  fullName: 'Maria da Silva',
  birthDate: '1998-01-20',
  email: 'maria.silva@example.com',
  phone: '(11) 99999-9999',
  password: 'Senha123',
  confirmPassword: 'Senha123',
  acceptLgpd: true,
};

describe('validateRegisterForm', () => {
  it('falha quando campos obrigatorios estao vazios', () => {
    const result = validateRegisterForm({
      fullName: '',
      birthDate: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptLgpd: false,
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.fullName).toBeTruthy();
    expect(result.errors.birthDate).toBeTruthy();
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.phone).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
    expect(result.errors.confirmPassword).toBeTruthy();
    expect(result.errors.acceptLgpd).toBeTruthy();
  });

  it('falha para e-mail invalido', () => {
    const result = validateRegisterForm({
      ...basePayload,
      email: 'email-invalido',
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.email).toMatch(/e-mail valido/i);
  });

  it('falha para senha curta', () => {
    const result = validateRegisterForm({
      ...basePayload,
      password: 'abc12',
      confirmPassword: 'abc12',
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.password).toMatch(/8 caracteres/i);
  });

  it('falha quando confirmacao de senha nao confere', () => {
    const result = validateRegisterForm({
      ...basePayload,
      confirmPassword: 'SenhaDiferente123',
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.confirmPassword).toMatch(/nao coincidem/i);
  });

  it('falha quando LGPD nao e aceito', () => {
    const result = validateRegisterForm({
      ...basePayload,
      acceptLgpd: false,
    });

    expect(result.sanitized).toBeUndefined();
    expect(result.errors.acceptLgpd).toBeTruthy();
  });

  it('retorna payload sanitizado para cadastro valido', () => {
    const result = validateRegisterForm({
      ...basePayload,
      fullName: '  Maria   da Silva  ',
      email: '  MARIA.SILVA@EXAMPLE.COM ',
      phone: '11 99999-9999',
    });

    expect(result.errors).toEqual({});
    expect(result.sanitized).toEqual({
      fullName: 'Maria da Silva',
      birthDate: '1998-01-20',
      email: 'maria.silva@example.com',
      phone: '+5511999999999',
      password: 'Senha123',
      acceptLgpd: true,
    });
  });
});
