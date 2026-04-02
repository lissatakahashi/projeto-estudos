CREATE TABLE IF NOT EXISTS public.badges (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE CHECK (char_length("slug") >= 3),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL CHECK ("category" IN ('study', 'economy', 'customization', 'pet')),
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."userBadges" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "badgeId" UUID NOT NULL REFERENCES public.badges("id") ON DELETE CASCADE,
    "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_badges_unique_per_user_badge UNIQUE ("userId", "badgeId")
);

CREATE INDEX IF NOT EXISTS badges_is_active_idx
    ON public.badges("isActive");

CREATE INDEX IF NOT EXISTS user_badges_user_id_earned_at_idx
    ON public."userBadges"("userId", "earnedAt" DESC);

DROP TRIGGER IF EXISTS badges_set_updated_at ON public.badges;
CREATE TRIGGER badges_set_updated_at
    BEFORE UPDATE ON public.badges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."userBadges" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active badges" ON public.badges;
CREATE POLICY "Anyone can read active badges"
    ON public.badges
    FOR SELECT
    USING ("isActive" = TRUE);

DROP POLICY IF EXISTS "Users can read own badges" ON public."userBadges";
CREATE POLICY "Users can read own badges"
    ON public."userBadges"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own badges" ON public."userBadges";
CREATE POLICY "Users can insert own badges"
    ON public."userBadges"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

INSERT INTO public.badges (
    "slug",
    "name",
    "description",
    "category",
    "icon",
    "isActive"
)
VALUES
    (
        'first_focus_session',
        'Primeiro Foco',
        'Conclua sua primeira sessão de foco válida.',
        'study',
        'timer',
        TRUE
    ),
    (
        'four_focus_sessions',
        'Ritmo Inicial',
        'Conclua 4 sessões de foco válidas.',
        'study',
        'military_tech',
        TRUE
    ),
    (
        'ten_focus_sessions',
        'Persistência Acadêmica',
        'Conclua 10 sessões de foco válidas.',
        'study',
        'emoji_events',
        TRUE
    ),
    (
        'first_shop_purchase',
        'Primeira Compra',
        'Realize sua primeira compra na loja.',
        'economy',
        'shopping_bag',
        TRUE
    ),
    (
        'first_environment_item_equipped',
        'Ambiente Personalizado',
        'Equipe seu primeiro item no ambiente virtual.',
        'customization',
        'palette',
        TRUE
    ),
    (
        'first_pet_feed',
        'Cuidado Inicial',
        'Alimente o pet pela primeira vez.',
        'pet',
        'pets',
        TRUE
    ),
    (
        'wallet_balance_100',
        'Reserva Estratégica',
        'Acumule 100 moedas de saldo na carteira.',
        'economy',
        'savings',
        TRUE
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "category" = EXCLUDED."category",
    "icon" = EXCLUDED."icon",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();
