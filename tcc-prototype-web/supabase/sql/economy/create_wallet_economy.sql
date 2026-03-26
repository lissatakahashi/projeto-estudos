CREATE TABLE IF NOT EXISTS public.wallets (
    "walletId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    "balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" >= 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."walletTransactions" (
    "transactionId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "amount" INTEGER NOT NULL CHECK ("amount" > 0),
    "transactionType" TEXT NOT NULL CHECK ("transactionType" IN ('credit', 'debit')),
    "reason" TEXT NOT NULL CHECK ("reason" IN ('focus_session_completed', 'shop_purchase', 'refund', 'manual_adjustment')),
    "referenceType" TEXT NOT NULL CHECK ("referenceType" IN ('pomodoro_session', 'shop_purchase', 'refund', 'system')),
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wallet_transactions_reference_unique UNIQUE ("userId", "referenceType", "referenceId", "transactionType", "reason")
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_created_idx
    ON public."walletTransactions"("userId", "createdAt" DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallets_set_updated_at ON public.wallets;
CREATE TRIGGER wallets_set_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."walletTransactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own wallets" ON public.wallets;
CREATE POLICY "Users can read own wallets"
    ON public.wallets
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
CREATE POLICY "Users can insert own wallets"
    ON public.wallets
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
CREATE POLICY "Users can update own wallets"
    ON public.wallets
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can read own wallet transactions" ON public."walletTransactions";
CREATE POLICY "Users can read own wallet transactions"
    ON public."walletTransactions"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON public."walletTransactions";
CREATE POLICY "Users can insert own wallet transactions"
    ON public."walletTransactions"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE OR REPLACE FUNCTION public.award_focus_session_coins(
    p_focus_session_id UUID,
    p_planned_duration_seconds INTEGER
)
RETURNS TABLE (
    awarded BOOLEAN,
    awarded_amount INTEGER,
    new_balance INTEGER,
    transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reward INTEGER;
    v_transaction_id UUID;
    v_new_balance INTEGER;
    v_session_owner UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT "userId"
      INTO v_session_owner
      FROM public."pomodoroSessions"
     WHERE "sessionId" = p_focus_session_id
       AND "status" = 'completed'
     LIMIT 1;

    IF v_session_owner IS NULL OR v_session_owner <> v_user_id THEN
        RETURN QUERY SELECT FALSE, 0, COALESCE((SELECT "balance" FROM public.wallets WHERE "userId" = v_user_id), 0), NULL::UUID;
        RETURN;
    END IF;

    v_reward := FLOOR(GREATEST(p_planned_duration_seconds, 0) / 300.0)::INTEGER;

    IF v_reward <= 0 THEN
        RETURN QUERY SELECT FALSE, 0, COALESCE((SELECT "balance" FROM public.wallets WHERE "userId" = v_user_id), 0), NULL::UUID;
        RETURN;
    END IF;

    INSERT INTO public.wallets ("userId", "balance")
    VALUES (v_user_id, 0)
    ON CONFLICT ("userId") DO NOTHING;

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
        v_reward,
        'credit',
        'focus_session_completed',
        'pomodoro_session',
        p_focus_session_id::TEXT,
        'Recompensa por conclusao valida de sessao de foco.'
    )
    ON CONFLICT ON CONSTRAINT wallet_transactions_reference_unique DO NOTHING
    RETURNING "transactionId" INTO v_transaction_id;

    IF v_transaction_id IS NULL THEN
        SELECT "balance" INTO v_new_balance FROM public.wallets WHERE "userId" = v_user_id;
        RETURN QUERY SELECT FALSE, 0, COALESCE(v_new_balance, 0), NULL::UUID;
        RETURN;
    END IF;

    UPDATE public.wallets
       SET "balance" = "balance" + v_reward
     WHERE "userId" = v_user_id
     RETURNING "balance" INTO v_new_balance;

    RETURN QUERY SELECT TRUE, v_reward, COALESCE(v_new_balance, 0), v_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.award_focus_session_coins(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_focus_session_coins(UUID, INTEGER) TO authenticated;
