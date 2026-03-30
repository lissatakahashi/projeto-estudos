CREATE TABLE IF NOT EXISTS public."userPetStates" (
    "userId" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "petName" TEXT NOT NULL DEFAULT 'Coruja Foco',
    "petType" TEXT NOT NULL DEFAULT 'owl' CHECK ("petType" IN ('owl', 'cat', 'fox')),
    "hungerLevel" INTEGER NOT NULL DEFAULT 70 CHECK ("hungerLevel" BETWEEN 0 AND 100),
    "moodLevel" INTEGER NOT NULL DEFAULT 55 CHECK ("moodLevel" BETWEEN 0 AND 100),
    "lastFedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_pet_states_set_updated_at ON public."userPetStates";
CREATE TRIGGER user_pet_states_set_updated_at
    BEFORE UPDATE ON public."userPetStates"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public."userPetStates" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pet state" ON public."userPetStates";
CREATE POLICY "Users can read own pet state"
    ON public."userPetStates"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own pet state" ON public."userPetStates";
CREATE POLICY "Users can insert own pet state"
    ON public."userPetStates"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own pet state" ON public."userPetStates";
CREATE POLICY "Users can update own pet state"
    ON public."userPetStates"
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

ALTER TABLE public."walletTransactions"
    DROP CONSTRAINT IF EXISTS "walletTransactions_reason_check";

ALTER TABLE public."walletTransactions"
    ADD CONSTRAINT "walletTransactions_reason_check"
    CHECK (
      "reason" IN (
        'focus_session_completed',
        'shop_purchase',
        'refund',
        'manual_adjustment',
        'pet_fed'
      )
    );

ALTER TABLE public."walletTransactions"
    DROP CONSTRAINT IF EXISTS "walletTransactions_referenceType_check";

ALTER TABLE public."walletTransactions"
    ADD CONSTRAINT "walletTransactions_referenceType_check"
    CHECK (
      "referenceType" IN (
        'pomodoro_session',
        'shop_purchase',
        'refund',
        'system',
        'pet_feed'
      )
    );

CREATE OR REPLACE FUNCTION public.get_or_create_user_pet_state()
RETURNS TABLE (
    user_id UUID,
    pet_name TEXT,
    pet_type TEXT,
    hunger_level INTEGER,
    mood_level INTEGER,
    last_fed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public."userPetStates" ("userId")
    VALUES (v_user_id)
    ON CONFLICT ("userId") DO NOTHING;

    RETURN QUERY
      SELECT
        p."userId" AS user_id,
        p."petName" AS pet_name,
        p."petType" AS pet_type,
        p."hungerLevel" AS hunger_level,
        p."moodLevel" AS mood_level,
        p."lastFedAt" AS last_fed_at,
        p."createdAt" AS created_at,
        p."updatedAt" AS updated_at
      FROM public."userPetStates" p
      WHERE p."userId" = v_user_id
      LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_user_pet_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_pet_state() TO authenticated;

CREATE OR REPLACE FUNCTION public.feed_user_pet()
RETURNS TABLE (
    success BOOLEAN,
    reason TEXT,
    new_balance INTEGER,
    fed_at TIMESTAMPTZ,
    cooldown_remaining_seconds INTEGER,
    pet JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_feed_cost INTEGER := 5;
    v_cooldown_seconds INTEGER := 60;
    v_wallet_balance INTEGER := 0;
    v_now TIMESTAMPTZ := NOW();
    v_remaining INTEGER := 0;
    v_transaction_id UUID;
    v_pet RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.wallets ("userId", "balance")
    VALUES (v_user_id, 0)
    ON CONFLICT ("userId") DO NOTHING;

    INSERT INTO public."userPetStates" ("userId")
    VALUES (v_user_id)
    ON CONFLICT ("userId") DO NOTHING;

    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT || ':pet_feed', 0));

    SELECT *
      INTO v_pet
      FROM public."userPetStates"
     WHERE "userId" = v_user_id
     FOR UPDATE;

    IF v_pet."lastFedAt" IS NOT NULL THEN
        v_remaining := GREATEST(0, v_cooldown_seconds - FLOOR(EXTRACT(EPOCH FROM (v_now - v_pet."lastFedAt")))::INTEGER);
    END IF;

    IF v_remaining > 0 THEN
        SELECT "balance" INTO v_wallet_balance FROM public.wallets WHERE "userId" = v_user_id;

        RETURN QUERY
          SELECT
            FALSE,
            'cooldown_active',
            COALESCE(v_wallet_balance, 0),
            v_pet."lastFedAt",
            v_remaining,
            jsonb_build_object(
              'user_id', v_pet."userId",
              'pet_name', v_pet."petName",
              'pet_type', v_pet."petType",
              'hunger_level', v_pet."hungerLevel",
              'mood_level', v_pet."moodLevel",
              'last_fed_at', v_pet."lastFedAt",
              'created_at', v_pet."createdAt",
              'updated_at', v_pet."updatedAt"
            );
        RETURN;
    END IF;

    SELECT "balance"
      INTO v_wallet_balance
      FROM public.wallets
     WHERE "userId" = v_user_id
     FOR UPDATE;

    IF COALESCE(v_wallet_balance, 0) < v_feed_cost THEN
        RETURN QUERY
          SELECT
            FALSE,
            'insufficient_balance',
            COALESCE(v_wallet_balance, 0),
            v_pet."lastFedAt",
            0,
            jsonb_build_object(
              'user_id', v_pet."userId",
              'pet_name', v_pet."petName",
              'pet_type', v_pet."petType",
              'hunger_level', v_pet."hungerLevel",
              'mood_level', v_pet."moodLevel",
              'last_fed_at', v_pet."lastFedAt",
              'created_at', v_pet."createdAt",
              'updated_at', v_pet."updatedAt"
            );
        RETURN;
    END IF;

    INSERT INTO public."walletTransactions" (
        "userId",
        "amount",
        "transactionType",
        "reason",
        "referenceType",
        "referenceId",
        "description"
    )
    VALUES (
        v_user_id,
        v_feed_cost,
        'debit',
        'pet_fed',
        'pet_feed',
        gen_random_uuid()::TEXT,
        'Alimentacao do personagem virtual.'
    )
    RETURNING "transactionId" INTO v_transaction_id;

    UPDATE public.wallets
       SET "balance" = "balance" - v_feed_cost
     WHERE "userId" = v_user_id
     RETURNING "balance" INTO v_wallet_balance;

    UPDATE public."userPetStates"
       SET "hungerLevel" = LEAST(100, "hungerLevel" + 25),
           "moodLevel" = LEAST(100, "moodLevel" + 12),
           "lastFedAt" = v_now,
           "updatedAt" = v_now
     WHERE "userId" = v_user_id;

    SELECT *
      INTO v_pet
      FROM public."userPetStates"
     WHERE "userId" = v_user_id;

    RETURN QUERY
      SELECT
        TRUE,
        'fed',
        COALESCE(v_wallet_balance, 0),
        v_pet."lastFedAt",
        0,
        jsonb_build_object(
          'user_id', v_pet."userId",
          'pet_name', v_pet."petName",
          'pet_type', v_pet."petType",
          'hunger_level', v_pet."hungerLevel",
          'mood_level', v_pet."moodLevel",
          'last_fed_at', v_pet."lastFedAt",
          'created_at', v_pet."createdAt",
          'updated_at', v_pet."updatedAt"
        );
END;
$$;

REVOKE ALL ON FUNCTION public.feed_user_pet() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feed_user_pet() TO authenticated;
