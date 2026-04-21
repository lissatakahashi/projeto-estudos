import type { InventoryApplyTarget, InventoryEquipSlot } from '../domain/shop/types/shop';

export function getInventoryEquipStatusLabel(isEquipped: boolean): string {
  return isEquipped ? 'Equipado' : 'Não equipado';
}

export function getInventoryCustomizationStatusLabel(isReadyForCustomization: boolean): string {
  return isReadyForCustomization ? 'Pronto para personalização' : 'Aguardando disponibilidade';
}

export function getInventoryEquipSlotLabel(slot: InventoryEquipSlot | null): string {
  if (!slot) {
    return 'Não definido';
  }

  if (slot === 'environment') {
    return 'Ambiente';
  }

  if (slot === 'avatar') {
    return 'Avatar';
  }

  if (slot === 'pet') {
    return 'Pet';
  }

  if (slot === 'badge') {
    return 'Emblema';
  }

  return slot;
}

export function getInventoryApplyTargetLabel(target: InventoryApplyTarget | null): string {
  if (!target) {
    return 'Não definido';
  }

  if (target === 'environment') {
    return 'Ambiente';
  }

  if (target === 'character') {
    return 'Personagem';
  }

  if (target === 'pet') {
    return 'Pet';
  }

  if (target === 'none') {
    return 'Nenhum';
  }

  return target;
}
