import type { EnvironmentSlotName, EquipEnvironmentResult } from '../types/environment';

export type EquipEnvironmentItemDeps = {
  equipEnvironmentItem: (input: {
    slotName: EnvironmentSlotName;
    inventoryEntryId: string | null;
  }) => Promise<{
    data: {
      success: boolean;
      reason: string;
      slotName: string;
      inventoryEntryId: string | null;
      itemId: string | null;
    } | null;
    error: { message: string } | null;
  }>;
};

export async function equipEnvironmentItem(
  deps: EquipEnvironmentItemDeps,
  input: {
    userId: string | null;
    slotName: EquipEnvironmentResult['slotName'];
    inventoryEntryId: string | null;
  },
): Promise<EquipEnvironmentResult> {
  if (!input.userId) {
    return {
      success: false,
      reason: 'unauthorized',
      slotName: input.slotName,
      inventoryEntryId: null,
      itemId: null,
    };
  }

  const { data, error } = await deps.equipEnvironmentItem({
    slotName: input.slotName,
    inventoryEntryId: input.inventoryEntryId,
  });

  if (error || !data) {
    return {
      success: false,
      reason: 'integrity_error',
      slotName: input.slotName,
      inventoryEntryId: null,
      itemId: null,
    };
  }

  const mappedReason = ((): EquipEnvironmentResult['reason'] => {
    switch (data.reason) {
      case 'equipped':
      case 'cleared':
      case 'item_not_owned':
      case 'incompatible_slot':
      case 'already_equipped_elsewhere':
        return data.reason;
      default:
        return 'integrity_error';
    }
  })();

  return {
    success: Boolean(data.success),
    reason: mappedReason,
    slotName: data.slotName as EquipEnvironmentResult['slotName'],
    inventoryEntryId: data.inventoryEntryId,
    itemId: data.itemId,
  };
}
