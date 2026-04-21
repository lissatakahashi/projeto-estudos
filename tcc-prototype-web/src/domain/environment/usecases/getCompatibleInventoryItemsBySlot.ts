import type { InventoryItem } from '../../shop/types/shop';
import { isInventoryItemCompatibleWithSlot, type EnvironmentSlotName } from '../types/environment';

export function getCompatibleInventoryItemsBySlot(
  inventory: InventoryItem[],
  slotName: EnvironmentSlotName,
): InventoryItem[] {
  return inventory.filter((entry) => isInventoryItemCompatibleWithSlot(entry, slotName));
}
