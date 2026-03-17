import type {
    RegisterFormErrors,
    RegisterFormValues,
    RegisterValidationResult,
    ValidRegisterPayload,
} from '../types/register';
import { normalizeBrazilianPhone, normalizeEmail } from './identifier';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

function isValidBirthDate(value: string): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const birthUtc = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));

  if (birthUtc > todayUtc) {
    return false;
  }

  const oldestAllowed = new Date(Date.UTC(todayUtc.getUTCFullYear() - 120, todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
  if (birthUtc < oldestAllowed) {
    return false;
  }

  return true;
}

function hasAtLeastTwoWords(fullName: string): boolean {
  return fullName
    .split(' ')
    .filter((part) => part.length > 0)
    .length >= 2;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterValidationResult {
  const errors: RegisterFormErrors = {};

  const fullName = normalizeFullName(values.fullName);
  const birthDate = values.birthDate.trim();
  const email = normalizeEmail(values.email);
  const phone = normalizeBrazilianPhone(values.phone);
  const password = values.password;

  if (!fullName) {
    errors.fullName = 'Informe seu nome completo.';
  } else {
    if (fullName.length < 5) {
      errors.fullName = 'O nome completo deve ter pelo menos 5 caracteres.';
    } else if (!hasAtLeastTwoWords(fullName)) {
      errors.fullName = 'Informe nome e sobrenome.';
    }
  }

  if (!birthDate) {
    errors.birthDate = 'Informe sua data de nascimento.';
  } else if (!isValidBirthDate(birthDate)) {
    errors.birthDate = 'Informe uma data de nascimento valida e realista.';
  }

  if (!email) {
    errors.email = 'Informe seu e-mail.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Informe seu celular.';
  } else if (!phone) {
    errors.phone = 'Informe um celular valido no padrao brasileiro.';
  }

  if (!password) {
    errors.password = 'Informe uma senha.';
  } else if (!PASSWORD_PATTERN.test(password)) {
    errors.password = 'A senha deve ter ao menos 8 caracteres, 1 letra e 1 numero.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha.';
  } else if (password !== values.confirmPassword) {
    errors.confirmPassword = 'As senhas nao coincidem.';
  }

  if (!values.acceptLgpd) {
    errors.acceptLgpd = 'Voce precisa aceitar a politica de privacidade para continuar.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const sanitized: ValidRegisterPayload = {
    fullName,
    birthDate,
    email,
    phone: phone!,
    password,
    acceptLgpd: true,
  };

  return { errors: {}, sanitized };
}

export { normalizeBrazilianPhone } from './identifier';

