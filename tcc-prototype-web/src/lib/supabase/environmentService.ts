import type { EnvironmentSlotName, EquippedEnvironmentItem } from '../../domain/environment/types/environment';
import { supabase } from './client';
import type { Database } from './types';

type EnvironmentRow = Database['public']['Tables']['userEnvironmentSlots']['Row'];

type EquipEnvironmentRpcRow = {
  success: boolean;
  reason: string;
  slot_name: string;
  inventory_entry_id: string | null;
  item_id: string | null;
};

export type EnvironmentServiceError = {
  message: string;
  originalError?: unknown;
};

function mapEnvironmentRow(row: EnvironmentRow): EquippedEnvironmentItem {
  return {
    id: row.id,
    userId: row.userId,
    slotName: row.slotName as EnvironmentSlotName,
    inventoryEntryId: row.inventoryEntryId,
    itemId: row.itemId,
    equippedAt: row.equippedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listUserEnvironmentItems(
  userId: string,
): Promise<{ data: EquippedEnvironmentItem[] | null; error: EnvironmentServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('userEnvironmentSlots')
      .select('*')
      .eq('userId', userId)
      .order('slotName', { ascending: true });

    if (error) {
      return { data: null, error: { message: 'Erro ao carregar ambiente personalizado.', originalError: error } };
    }

    return { data: (data ?? []).map((row) => mapEnvironmentRow(row as EnvironmentRow)), error: null };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao carregar ambiente.', originalError } };
  }
}

export async function equipEnvironmentItemRpc(input: {
  slotName: EnvironmentSlotName;
  inventoryEntryId: string | null;
}): Promise<{
  data: {
    success: boolean;
    reason: string;
    slotName: string;
    inventoryEntryId: string | null;
    itemId: string | null;
  } | null;
  error: EnvironmentServiceError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('equip_user_environment_item', {
      p_slot_name: input.slotName,
      p_inventory_entry_id: input.inventoryEntryId,
    });

    if (error) {
      return { data: null, error: { message: 'Erro ao equipar item no ambiente.', originalError: error } };
    }

    const row = (Array.isArray(data) ? data[0] : data) as EquipEnvironmentRpcRow | undefined;
    if (!row) {
      return { data: null, error: { message: 'Resposta invalida ao equipar item no ambiente.' } };
    }

    return {
      data: {
        success: Boolean(row.success),
        reason: row.reason,
        slotName: row.slot_name,
        inventoryEntryId: row.inventory_entry_id,
        itemId: row.item_id,
      },
      error: null,
    };
  } catch (originalError) {
    return { data: null, error: { message: 'Erro inesperado ao equipar item.', originalError } };
  }
}
