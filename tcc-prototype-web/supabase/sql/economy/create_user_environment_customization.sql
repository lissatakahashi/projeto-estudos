ALTER TABLE public."shopItems"
    ADD COLUMN IF NOT EXISTS "environmentSlot" TEXT
    CHECK (
      "environmentSlot" IS NULL
      OR "environmentSlot" IN (
        'background',
        'desk',
        'wall',
        'floor',
        'decoration_left',
        'decoration_right',
        'shelf',
        'window_area'
      )
    );

CREATE TABLE IF NOT EXISTS public."userEnvironmentSlots" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "slotName" TEXT NOT NULL CHECK (
      "slotName" IN (
        'background',
        'desk',
        'wall',
        'floor',
        'decoration_left',
        'decoration_right',
        'shelf',
        'window_area'
      )
    ),
    "inventoryEntryId" UUID NOT NULL REFERENCES public."userInventory"("inventoryEntryId") ON DELETE CASCADE,
    "itemId" UUID NOT NULL REFERENCES public."shopItems"("itemId") ON DELETE RESTRICT,
    "equippedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_environment_slot_unique_per_user UNIQUE ("userId", "slotName")
);

CREATE UNIQUE INDEX IF NOT EXISTS user_environment_item_unique_per_user_idx
    ON public."userEnvironmentSlots"("userId", "inventoryEntryId");

CREATE INDEX IF NOT EXISTS user_environment_user_slot_idx
    ON public."userEnvironmentSlots"("userId", "slotName");

DROP TRIGGER IF EXISTS user_environment_slots_set_updated_at ON public."userEnvironmentSlots";
CREATE TRIGGER user_environment_slots_set_updated_at
    BEFORE UPDATE ON public."userEnvironmentSlots"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public."userEnvironmentSlots" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own environment slots" ON public."userEnvironmentSlots";
CREATE POLICY "Users can read own environment slots"
    ON public."userEnvironmentSlots"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own environment slots" ON public."userEnvironmentSlots";
CREATE POLICY "Users can insert own environment slots"
    ON public."userEnvironmentSlots"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own environment slots" ON public."userEnvironmentSlots";
CREATE POLICY "Users can update own environment slots"
    ON public."userEnvironmentSlots"
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own environment slots" ON public."userEnvironmentSlots";
CREATE POLICY "Users can delete own environment slots"
    ON public."userEnvironmentSlots"
    FOR DELETE
    USING (auth.uid() = "userId");

CREATE OR REPLACE FUNCTION public.equip_user_environment_item(
    p_slot_name TEXT,
    p_inventory_entry_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    reason TEXT,
    slot_name TEXT,
    inventory_entry_id UUID,
    item_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_inventory RECORD;
    v_already_slot TEXT;
    v_is_compatible BOOLEAN := FALSE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_slot_name NOT IN (
      'background',
      'desk',
      'wall',
      'floor',
      'decoration_left',
      'decoration_right',
      'shelf',
      'window_area'
    ) THEN
        RETURN QUERY SELECT FALSE, 'incompatible_slot', p_slot_name, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    IF p_inventory_entry_id IS NULL THEN
        DELETE FROM public."userEnvironmentSlots"
         WHERE "userId" = v_user_id
           AND "slotName" = p_slot_name;

        RETURN QUERY SELECT TRUE, 'cleared', p_slot_name, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    SELECT inv.*, item."category", item."environmentSlot"
      INTO v_inventory
      FROM public."userInventory" inv
      JOIN public."shopItems" item
        ON item."itemId" = inv."itemId"
     WHERE inv."inventoryEntryId" = p_inventory_entry_id
       AND inv."userId" = v_user_id
     LIMIT 1;

    IF v_inventory IS NULL THEN
        RETURN QUERY SELECT FALSE, 'item_not_owned', p_slot_name, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    SELECT "slotName"
      INTO v_already_slot
      FROM public."userEnvironmentSlots"
     WHERE "userId" = v_user_id
       AND "inventoryEntryId" = p_inventory_entry_id
       AND "slotName" <> p_slot_name
     LIMIT 1;

    IF v_already_slot IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'already_equipped_elsewhere', p_slot_name, p_inventory_entry_id, v_inventory."itemId";
        RETURN;
    END IF;

    v_is_compatible := (
      (p_slot_name = 'background' AND v_inventory."category" = 'theme')
      OR (p_slot_name = 'desk' AND v_inventory."category" = 'decor')
      OR (p_slot_name = 'wall' AND v_inventory."category" = 'decor')
      OR (p_slot_name = 'floor' AND v_inventory."category" = 'decor')
      OR (p_slot_name = 'decoration_left' AND v_inventory."category" = 'decor')
      OR (p_slot_name = 'decoration_right' AND v_inventory."category" = 'decor')
      OR (p_slot_name = 'shelf' AND v_inventory."category" IN ('decor', 'badge'))
      OR (p_slot_name = 'window_area' AND v_inventory."category" IN ('decor', 'theme'))
    );

    IF v_inventory."environmentSlot" IS NOT NULL THEN
      v_is_compatible := v_is_compatible AND v_inventory."environmentSlot" = p_slot_name;
    END IF;

    IF NOT v_is_compatible THEN
        RETURN QUERY SELECT FALSE, 'incompatible_slot', p_slot_name, p_inventory_entry_id, v_inventory."itemId";
        RETURN;
    END IF;

    INSERT INTO public."userEnvironmentSlots" (
      "userId",
      "slotName",
      "inventoryEntryId",
      "itemId",
      "equippedAt"
    )
    VALUES (
      v_user_id,
      p_slot_name,
      p_inventory_entry_id,
      v_inventory."itemId",
      NOW()
    )
    ON CONFLICT ("userId", "slotName")
    DO UPDATE
      SET "inventoryEntryId" = EXCLUDED."inventoryEntryId",
          "itemId" = EXCLUDED."itemId",
          "equippedAt" = NOW(),
          "updatedAt" = NOW();

    RETURN QUERY SELECT TRUE, 'equipped', p_slot_name, p_inventory_entry_id, v_inventory."itemId";
END;
$$;

REVOKE ALL ON FUNCTION public.equip_user_environment_item(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.equip_user_environment_item(TEXT, UUID) TO authenticated;

UPDATE public."shopItems"
SET "environmentSlot" = CASE
    WHEN "slug" LIKE 'tema-%' THEN 'background'
    WHEN "slug" LIKE '%biblioteca%' THEN 'wall'
    ELSE "environmentSlot"
END
WHERE "environmentSlot" IS NULL;
