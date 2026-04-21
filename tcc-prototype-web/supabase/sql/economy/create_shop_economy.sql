CREATE TABLE IF NOT EXISTS public."shopItems" (
    "itemId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE CHECK (char_length("slug") >= 3),
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL CHECK ("price" > 0),
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shop_items_active_price_idx
    ON public."shopItems"("isActive", "price");

CREATE TABLE IF NOT EXISTS public."userInventory" (
    "inventoryEntryId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "itemId" UUID NOT NULL REFERENCES public."shopItems"("itemId") ON DELETE RESTRICT,
    "quantity" INTEGER NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
    "purchaseId" UUID NOT NULL,
    "walletTransactionId" UUID NOT NULL REFERENCES public."walletTransactions"("transactionId") ON DELETE RESTRICT,
    "acquiredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_inventory_unique_item_per_user UNIQUE ("userId", "itemId"),
    CONSTRAINT user_inventory_unique_purchase UNIQUE ("purchaseId"),
    CONSTRAINT user_inventory_unique_wallet_tx UNIQUE ("walletTransactionId")
);

CREATE INDEX IF NOT EXISTS user_inventory_user_acquired_idx
    ON public."userInventory"("userId", "acquiredAt" DESC);

DROP TRIGGER IF EXISTS shop_items_set_updated_at ON public."shopItems";
CREATE TRIGGER shop_items_set_updated_at
    BEFORE UPDATE ON public."shopItems"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS user_inventory_set_updated_at ON public."userInventory";
CREATE TRIGGER user_inventory_set_updated_at
    BEFORE UPDATE ON public."userInventory"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public."shopItems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."userInventory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active shop items" ON public."shopItems";
CREATE POLICY "Anyone can read active shop items"
    ON public."shopItems"
    FOR SELECT
    USING ("isActive" = TRUE);

DROP POLICY IF EXISTS "Users can read own inventory" ON public."userInventory";
CREATE POLICY "Users can read own inventory"
    ON public."userInventory"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own inventory" ON public."userInventory";
CREATE POLICY "Users can insert own inventory"
    ON public."userInventory"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE OR REPLACE FUNCTION public.purchase_shop_item(
    p_item_id UUID
)
RETURNS TABLE (
    purchased BOOLEAN,
    reason TEXT,
    new_balance INTEGER,
    transaction_id UUID,
    inventory_entry_id UUID,
    purchase_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item RECORD;
    v_wallet_balance INTEGER;
    v_transaction_id UUID;
    v_inventory_entry_id UUID;
    v_purchase_id UUID := gen_random_uuid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT *
      INTO v_item
      FROM public."shopItems"
     WHERE "itemId" = p_item_id
       AND "isActive" = TRUE
     FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'item_unavailable', COALESCE((SELECT "balance" FROM public.wallets WHERE "userId" = v_user_id), 0), NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    INSERT INTO public.wallets ("userId", "balance")
    VALUES (v_user_id, 0)
    ON CONFLICT ("userId") DO NOTHING;

    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT || ':' || p_item_id::TEXT, 0));

    IF EXISTS (
      SELECT 1
        FROM public."userInventory"
       WHERE "userId" = v_user_id
         AND "itemId" = p_item_id
    ) THEN
        SELECT "balance" INTO v_wallet_balance
          FROM public.wallets
         WHERE "userId" = v_user_id;

        RETURN QUERY SELECT FALSE, 'already_owned', COALESCE(v_wallet_balance, 0), NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    SELECT "balance"
      INTO v_wallet_balance
      FROM public.wallets
     WHERE "userId" = v_user_id
     FOR UPDATE;

    IF COALESCE(v_wallet_balance, 0) < v_item."price" THEN
        RETURN QUERY SELECT FALSE, 'insufficient_balance', COALESCE(v_wallet_balance, 0), NULL::UUID, NULL::UUID, NULL::UUID;
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
        v_item."price",
        'debit',
        'shop_purchase',
        'shop_purchase',
        v_purchase_id::TEXT,
        'Compra do item de loja: ' || v_item."name"
    )
    RETURNING "transactionId" INTO v_transaction_id;

    UPDATE public.wallets
       SET "balance" = "balance" - v_item."price"
     WHERE "userId" = v_user_id
     RETURNING "balance" INTO v_wallet_balance;

    INSERT INTO public."userInventory" (
        "userId",
        "itemId",
        "quantity",
        "purchaseId",
        "walletTransactionId"
    )
    VALUES (
        v_user_id,
        p_item_id,
        1,
        v_purchase_id,
        v_transaction_id
    )
    RETURNING "inventoryEntryId" INTO v_inventory_entry_id;

    RETURN QUERY SELECT TRUE, 'purchased', COALESCE(v_wallet_balance, 0), v_transaction_id, v_inventory_entry_id, v_purchase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_shop_item(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(UUID) TO authenticated;

INSERT INTO public."shopItems" (
    "name",
    "slug",
    "description",
    "price",
    "category",
    "rarity",
    "imageUrl",
    "isActive"
)
VALUES
    (
        'Tema Floresta Calma',
        'tema-floresta-calma',
        'Tema visual com paleta natural para reduzir fadiga visual durante o estudo.',
        20,
        'tema',
        'comum',
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80',
        TRUE
    ),
    (
        'Avatar Coruja Acadêmica',
        'avatar-coruja-academica',
        'Avatar exclusivo para representar consistência e foco acadêmico.',
        35,
        'avatar',
        'raro',
        'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
        TRUE
    ),
    (
        'Badge Maratona de Foco',
        'badge-maratona-de-foco',
        'Badge cosmética para destacar sessões de estudo prolongadas.',
        50,
        'badge',
        'épico',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        TRUE
    ),
    (
        'Kit Ambiente Biblioteca',
        'kit-ambiente-biblioteca',
        'Pacote visual com elementos de biblioteca para personalizar o ambiente.',
        70,
        'decoração',
        'lendário',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
        TRUE
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "price" = EXCLUDED."price",
    "category" = EXCLUDED."category",
    "rarity" = EXCLUDED."rarity",
    "imageUrl" = EXCLUDED."imageUrl",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();
