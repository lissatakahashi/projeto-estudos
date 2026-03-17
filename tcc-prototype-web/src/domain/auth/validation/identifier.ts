const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedAuthIdentifier =
  | { type: 'email'; email: string }
  | { type: 'phone'; phone: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeBrazilianPhone(phone: string): string | null {
  const digitsOnly = phone.replace(/\D/g, '');

  if (!digitsOnly) {
    return null;
  }

  const localDigits = digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)
    ? digitsOnly.slice(2)
    : digitsOnly;

  if (localDigits.length !== 10 && localDigits.length !== 11) {
    return null;
  }

  return `+55${localDigits}`;
}

export function parseAuthIdentifier(identifier: string): ParsedAuthIdentifier | null {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedEmail = normalizeEmail(trimmed);
  if (trimmed.includes('@')) {
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return null;
    }

    return { type: 'email', email: normalizedEmail };
  }

  const normalizedPhone = normalizeBrazilianPhone(trimmed);
  if (normalizedPhone) {
    return { type: 'phone', phone: normalizedPhone };
  }

  if (EMAIL_PATTERN.test(normalizedEmail)) {
    return { type: 'email', email: normalizedEmail };
  }

  return null;
}
