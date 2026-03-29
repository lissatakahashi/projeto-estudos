import type { InventoryItem } from '../../shop/types/shop';
import { isInventoryItemCompatibleWithSlot, type EnvironmentSlotName } from '../types/environment';

export function getCompatibleInventoryItemsBySlot(
  inventory: InventoryItem[],
  slotName: EnvironmentSlotName,
): InventoryItem[] {
  return inventory.filter((entry) => {
    if (!entry.isReadyForCustomization) {
      return false;
    }

    return isInventoryItemCompatibleWithSlot(entry, slotName);
  });
}
