-- Normalize Brazilian phone values to canonical +55 format.
CREATE OR REPLACE FUNCTION public.normalize_brazilian_phone(input_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    digits_only TEXT;
    local_digits TEXT;
BEGIN
    IF input_phone IS NULL THEN
        RETURN NULL;
    END IF;

    digits_only := regexp_replace(input_phone, '[^0-9]', '', 'g');

    IF digits_only = '' THEN
        RETURN NULL;
    END IF;

    IF left(digits_only, 2) = '55' AND char_length(digits_only) IN (12, 13) THEN
        local_digits := substring(digits_only FROM 3);
    ELSE
        local_digits := digits_only;
    END IF;

    IF char_length(local_digits) NOT IN (10, 11) THEN
        RETURN NULL;
    END IF;

    RETURN '+55' || local_digits;
END;
$$;

-- Keep existing rows in canonical format so lookups are stable.
UPDATE public.profiles
SET phone = public.normalize_brazilian_phone(phone)
WHERE public.normalize_brazilian_phone(phone) IS NOT NULL
  AND phone IS DISTINCT FROM public.normalize_brazilian_phone(phone);

-- Enforce uniqueness on normalized phone representation.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_normalized_unique_idx
ON public.profiles (public.normalize_brazilian_phone(phone))
WHERE public.normalize_brazilian_phone(phone) IS NOT NULL;

-- RPC used by login flow to resolve phone -> e-mail before Supabase Auth password login.
CREATE OR REPLACE FUNCTION public.resolve_login_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    normalized_phone TEXT;
    resolved_email TEXT;
BEGIN
    normalized_phone := public.normalize_brazilian_phone(p_phone);

    IF normalized_phone IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT p.email
    INTO resolved_email
    FROM public.profiles AS p
    WHERE public.normalize_brazilian_phone(p.phone) = normalized_phone
    LIMIT 1;

    RETURN resolved_email;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_login_email_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_email_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_login_email_by_phone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_login_email_by_phone(TEXT) TO service_role;
