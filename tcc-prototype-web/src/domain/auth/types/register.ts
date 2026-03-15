export type RegisterFormValues = {
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptLgpd: boolean;
};

export type RegisterFieldName = keyof RegisterFormValues;

export type RegisterFormErrors = Partial<Record<RegisterFieldName, string>>;

export type ValidRegisterPayload = {
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  password: string;
  acceptLgpd: true;
};

export type RegisterValidationResult = {
  errors: RegisterFormErrors;
  sanitized?: ValidRegisterPayload;
};

export const REGISTER_FORM_INITIAL_VALUES: RegisterFormValues = {
  fullName: '',
  birthDate: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptLgpd: false,
};
