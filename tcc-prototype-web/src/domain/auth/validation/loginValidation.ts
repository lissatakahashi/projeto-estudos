import type {
    LoginFormErrors,
    LoginFormValues,
    LoginValidationResult,
    ValidLoginPayload,
} from '../types/login';
import { parseAuthIdentifier } from './identifier';

export function validateLoginForm(values: LoginFormValues): LoginValidationResult {
  const errors: LoginFormErrors = {};

  const parsedIdentifier = parseAuthIdentifier(values.identifier);
  const password = values.password;

  if (!values.identifier.trim()) {
    errors.identifier = 'Informe seu e-mail ou celular.';
  } else if (!parsedIdentifier) {
    errors.identifier = 'Informe um e-mail valido ou celular com DDD.';
  }

  if (!password) {
    errors.password = 'Informe sua senha.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const sanitized: ValidLoginPayload = {
    identifier: parsedIdentifier!,
    password,
  };

  return { errors: {}, sanitized };
}
