import type { ValidRegisterPayload } from '../../domain/auth/types/register';
import {
    REGISTER_MIN_AGE_YEARS,
    validateBirthDate,
    type BirthDateValidationIssue,
} from '../../domain/auth/validation/birthDatePolicy';
import supabase from './client';

type RegisterServiceResult = {
  success: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
};

type ProfileUpsertPayload = {
  id: string;
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  lgpdConsentAccepted: boolean;
  lgpdConsentAt: string;
};

function getLoginRedirectTo(): string {
  const fallbackOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5174';

  const configuredBaseUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();

  if (configuredBaseUrl) {
    try {
      return new URL('/login', configuredBaseUrl).toString();
    } catch {
      return `${fallbackOrigin}/login`;
    }
  }

  return `${fallbackOrigin}/login`;
}

function toFriendlyAuthErrorMessage(errorMessage: string): string {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Este e-mail ja esta cadastrado. Tente fazer login ou recuperar sua senha.';
  }

  if (normalized.includes('invalid email')) {
    return 'O e-mail informado nao e valido.';
  }

  if (normalized.includes('password')) {
    return 'Nao foi possivel processar a senha informada.';
  }

  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  return 'Nao foi possivel concluir o cadastro agora. Tente novamente em instantes.';
}

function toFriendlyBirthDateErrorMessage(issue?: BirthDateValidationIssue): string {
  if (issue === 'future_date') {
    return 'A data de nascimento nao pode ser futura.';
  }

  if (issue === 'too_young') {
    return `A data de nascimento deve indicar idade minima de ${REGISTER_MIN_AGE_YEARS} anos.`;
  }

  return 'Informe uma data de nascimento valida.';
}

async function upsertProfile(payload: ProfileUpsertPayload): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    return { error: 'Nao foi possivel salvar os dados do perfil. Tente novamente.' };
  }

  return { error: null };
}

export async function registerWithEmail(payload: ValidRegisterPayload): Promise<RegisterServiceResult> {
  const birthDateValidation = validateBirthDate(payload.birthDate);
  if (!birthDateValidation.isValid) {
    return {
      success: false,
      message: toFriendlyBirthDateErrorMessage(birthDateValidation.issue),
    };
  }

  const lgpdConsentAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: getLoginRedirectTo(),
      data: {
        full_name: payload.fullName,
        birth_date: payload.birthDate,
        phone: payload.phone,
        lgpd_consent_accepted: payload.acceptLgpd,
        lgpd_consent_at: lgpdConsentAt,
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  const userId = data.user?.id;
  if (!userId) {
    return {
      success: false,
      message: 'Nao foi possivel identificar o usuario criado. Tente novamente.',
    };
  }

  // With email confirmation enabled, session can be null and profile creation is handled by DB trigger.
  if (data.session) {
    const { error: profileError } = await upsertProfile({
      id: userId,
      fullName: payload.fullName,
      birthDate: payload.birthDate,
      email: payload.email,
      phone: payload.phone,
      lgpdConsentAccepted: payload.acceptLgpd,
      lgpdConsentAt,
    });

    if (profileError) {
      return {
        success: false,
        message: profileError,
      };
    }
  }

  return {
    success: true,
    requiresEmailConfirmation: !data.session,
  };
}

export type { RegisterServiceResult };

