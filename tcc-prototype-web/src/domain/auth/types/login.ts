import type { ParsedAuthIdentifier } from '../validation/identifier';

export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type LoginFieldName = keyof LoginFormValues;

export type LoginFormErrors = Partial<Record<LoginFieldName, string>>;

export type ValidLoginPayload = {
  identifier: ParsedAuthIdentifier;
  password: string;
};

export type LoginValidationResult = {
  errors: LoginFormErrors;
  sanitized?: ValidLoginPayload;
};

export const LOGIN_FORM_INITIAL_VALUES: LoginFormValues = {
  identifier: '',
  password: '',
};
