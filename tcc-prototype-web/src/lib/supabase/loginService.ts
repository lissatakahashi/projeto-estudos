import type { ValidLoginPayload } from '../../domain/auth/types/login';
import { normalizeEmail } from '../../domain/auth/validation/identifier';
import supabase from './client';

type LoginServiceErrorField = 'identifier' | 'password' | 'general';

type LoginServiceResult =
  | { success: true }
  | {
    success: false;
    field: LoginServiceErrorField;
    message: string;
  };

function getCredentialErrorMessage(identifierType: ValidLoginPayload['identifier']['type']): string {
  if (identifierType === 'phone') {
    return 'Senha incorreta para o celular informado.';
  }

  return 'E-mail nao encontrado ou senha incorreta.';
}

async function resolveEmailByPhone(phone: string): Promise<{ email: string | null; error: boolean }> {
  const { data, error } = await supabase.rpc('resolve_login_email_by_phone', { p_phone: phone });

  if (error) {
    return { email: null, error: true };
  }

  if (!data || typeof data !== 'string') {
    return { email: null, error: false };
  }

  return {
    email: normalizeEmail(data),
    error: false,
  };
}

export async function loginWithIdentifier(payload: ValidLoginPayload): Promise<LoginServiceResult> {
  let emailForAuth: string;

  if (payload.identifier.type === 'phone') {
    const { email, error } = await resolveEmailByPhone(payload.identifier.phone);

    if (error) {
      return {
        success: false,
        field: 'general',
        message: 'Nao foi possivel validar o celular agora. Tente novamente em instantes.',
      };
    }

    if (!email) {
      return {
        success: false,
        field: 'identifier',
        message: 'Celular nao cadastrado.',
      };
    }

    emailForAuth = email;
  } else {
    emailForAuth = payload.identifier.email;
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: emailForAuth,
    password: payload.password,
  });

  if (authError) {
    const normalized = authError.message.toLowerCase();

    if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
      return {
        success: false,
        field: 'password',
        message: getCredentialErrorMessage(payload.identifier.type),
      };
    }

    return {
      success: false,
      field: 'general',
      message: 'Nao foi possivel concluir o login agora. Tente novamente em instantes.',
    };
  }

  return { success: true };
}

export type { LoginServiceErrorField, LoginServiceResult };

