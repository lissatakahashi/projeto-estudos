-- Create profiles table for user complementary registration data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "fullName" TEXT NOT NULL CHECK (char_length(trim("fullName")) >= 5),
    "birthDate" DATE NOT NULL CHECK (
        "birthDate" <= (CURRENT_DATE - INTERVAL '13 years')
        AND "birthDate" >= (CURRENT_DATE - INTERVAL '120 years')
    ),
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    "lgpdConsentAccepted" BOOLEAN NOT NULL DEFAULT FALSE,
    "lgpdConsentAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep columns searchable and prevent duplicated e-mails in profile table
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone);

-- Enable row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger function to automatically update updatedAt
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_profiles_updated_at();

-- Trigger function to persist metadata from auth.users into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        "fullName",
        "birthDate",
        email,
        phone,
        "lgpdConsentAccepted",
        "lgpdConsentAt"
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date, (CURRENT_DATE - INTERVAL '13 years')::date),
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE((NEW.raw_user_meta_data->>'lgpd_consent_accepted')::boolean, FALSE),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'lgpd_consent_at', '')::timestamptz, NOW())
    )
    ON CONFLICT (id)
    DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "birthDate" = EXCLUDED."birthDate",
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        "lgpdConsentAccepted" = EXCLUDED."lgpdConsentAccepted",
        "lgpdConsentAt" = EXCLUDED."lgpdConsentAt",
        "updatedAt" = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();
