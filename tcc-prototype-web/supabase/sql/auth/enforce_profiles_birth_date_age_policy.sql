-- Enforce age policy for profiles birth date: minimum 13 years and maximum 120 years.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_birth_date_age_policy_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_birth_date_age_policy_check
CHECK (
    "birthDate" <= (CURRENT_DATE - INTERVAL '13 years')
    AND "birthDate" >= (CURRENT_DATE - INTERVAL '120 years')
);
