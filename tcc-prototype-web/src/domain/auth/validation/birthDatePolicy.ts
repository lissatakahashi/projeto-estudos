export const REGISTER_MIN_AGE_YEARS = 13;
export const REGISTER_MAX_AGE_YEARS = 120;

export type BirthDateValidationIssue =
  | 'invalid_format'
  | 'future_date'
  | 'too_young'
  | 'too_old';

type BirthDateValidationResult = {
  isValid: boolean;
  issue?: BirthDateValidationIssue;
};

type BirthDateLimits = {
  earliestBirthDate: string;
  latestBirthDate: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

function subtractYearsUtc(date: Date, years: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear() - years, date.getUTCMonth(), date.getUTCDate()));
}

function formatDateToIso(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseIsoDateToUtc(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    Number.isNaN(year)
    || Number.isNaN(month)
    || Number.isNaN(day)
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function getBirthDateLimits(referenceDate = new Date()): BirthDateLimits {
  const todayUtc = toUtcDateOnly(referenceDate);
  const latestBirthDate = subtractYearsUtc(todayUtc, REGISTER_MIN_AGE_YEARS);
  const earliestBirthDate = subtractYearsUtc(todayUtc, REGISTER_MAX_AGE_YEARS);

  return {
    earliestBirthDate: formatDateToIso(earliestBirthDate),
    latestBirthDate: formatDateToIso(latestBirthDate),
  };
}

export function validateBirthDate(value: string, referenceDate = new Date()): BirthDateValidationResult {
  const parsedBirthDate = parseIsoDateToUtc(value);
  if (!parsedBirthDate) {
    return { isValid: false, issue: 'invalid_format' };
  }

  const todayUtc = toUtcDateOnly(referenceDate);
  const { latestBirthDate, earliestBirthDate } = getBirthDateLimits(referenceDate);
  const latestAllowedDate = parseIsoDateToUtc(latestBirthDate)!;
  const earliestAllowedDate = parseIsoDateToUtc(earliestBirthDate)!;

  if (parsedBirthDate > todayUtc) {
    return { isValid: false, issue: 'future_date' };
  }

  if (parsedBirthDate > latestAllowedDate) {
    return { isValid: false, issue: 'too_young' };
  }

  if (parsedBirthDate < earliestAllowedDate) {
    return { isValid: false, issue: 'too_old' };
  }

  return { isValid: true };
}