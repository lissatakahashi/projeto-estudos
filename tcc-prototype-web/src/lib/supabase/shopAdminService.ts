import type { CreateShopItemPayload, UpdateShopItemPayload } from '../../domain/shop/types/adminShop';
import type { ShopItem } from '../../domain/shop/types/shop';
import { supabase } from './client';
import type { Database } from './types';

type ShopItemRow = Database['public']['Tables']['shopItems']['Row'];

type ShopAdminServiceError = {
  message: string;
  originalError?: unknown;
};

function mapShopItemRow(row: ShopItemRow): ShopItem {
  return {
    itemId: row.itemId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category as ShopItem['category'],
    rarity: row.rarity as ShopItem['rarity'],
    environmentSlot: (row as Partial<ShopItemRow>).environmentSlot as ShopItem['environmentSlot'],
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapPossibleConstraintError(error: unknown, fallbackMessage: string): ShopAdminServiceError {
  const maybe = error as { code?: string; message?: string; details?: string } | undefined;

  if (maybe?.code === '42501' || /row-level security|permission denied/i.test(maybe?.message ?? '')) {
    return {
      message: 'Operacao bloqueada por politica de seguranca (RLS) da tabela shopItems. Aplique as policies de INSERT/UPDATE para usuarios autorizados no Supabase.',
      originalError: error,
    };
  }

  if (maybe?.code === '23505') {
    return {
      message: 'Slug ja utilizado por outro item. Escolha um slug unico.',
      originalError: error,
    };
  }

  return {
    message: maybe?.message ?? fallbackMessage,
    originalError: error,
  };
}

export async function listAllShopItems(): Promise<{ data: ShopItem[] | null; error: ShopAdminServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('shopItems')
      .select('*')
      .order('updatedAt', { ascending: false });

    if (error) {
      return {
        data: null,
        error: { message: 'Erro ao carregar itens do catalogo administrativo.', originalError: error },
      };
    }

    return { data: (data ?? []).map(mapShopItemRow), error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao listar itens administrativos.', originalError: error },
    };
  }
}

export async function createShopItem(payload: CreateShopItemPayload): Promise<{ data: ShopItem | null; error: ShopAdminServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('shopItems')
      .insert({
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        rarity: payload.rarity,
        imageUrl: payload.imageUrl,
        isActive: payload.isActive,
      })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: mapPossibleConstraintError(error, 'Erro ao criar item no catalogo.') };
    }

    return { data: mapShopItemRow(data), error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao criar item do catalogo.', originalError: error },
    };
  }
}

export async function updateShopItem(payload: UpdateShopItemPayload): Promise<{ data: ShopItem | null; error: ShopAdminServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('shopItems')
      .update({
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        rarity: payload.rarity,
        imageUrl: payload.imageUrl,
        isActive: payload.isActive,
      })
      .eq('itemId', payload.itemId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: mapPossibleConstraintError(error, 'Erro ao atualizar item no catalogo.') };
    }

    return { data: mapShopItemRow(data), error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao atualizar item do catalogo.', originalError: error },
    };
  }
}

export async function setShopItemStatus(input: {
  itemId: string;
  isActive: boolean;
}): Promise<{ data: ShopItem | null; error: ShopAdminServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('shopItems')
      .update({ isActive: input.isActive })
      .eq('itemId', input.itemId)
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: { message: 'Erro ao atualizar status do item.', originalError: error },
      };
    }

    return { data: mapShopItemRow(data), error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Erro inesperado ao atualizar status do item.', originalError: error },
    };
  }
}
