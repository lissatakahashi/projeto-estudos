ALTER TABLE public."userInventory"
    ADD COLUMN IF NOT EXISTS "isEquipped" BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "equipSlot" TEXT,
    ADD COLUMN IF NOT EXISTS "appliedTarget" TEXT,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public."userInventory"
SET "createdAt" = COALESCE("createdAt", "acquiredAt", NOW());

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_inventory_equip_slot_check'
    ) THEN
        ALTER TABLE public."userInventory"
            ADD CONSTRAINT user_inventory_equip_slot_check
            CHECK ("equipSlot" IS NULL OR "equipSlot" IN ('environment', 'avatar', 'pet', 'badge'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_inventory_applied_target_check'
    ) THEN
        ALTER TABLE public."userInventory"
            ADD CONSTRAINT user_inventory_applied_target_check
            CHECK ("appliedTarget" IS NULL OR "appliedTarget" IN ('environment', 'character', 'pet', 'none'));
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_inventory_one_equipped_per_slot_idx
    ON public."userInventory"("userId", "equipSlot")
    WHERE "isEquipped" = TRUE AND "equipSlot" IS NOT NULL;
