import { useCallback, useMemo, useState } from 'react';
import type {
    CreateShopItemPayload,
    ShopItemSortOption,
    ShopItemStatusFilter,
    UpdateShopItemPayload,
} from '../domain/shop/types/adminShop';
import type { ShopItem, ShopItemCategory } from '../domain/shop/types/shop';
import { createShopCatalogItem } from '../domain/shop/usecases/createShopCatalogItem';
import { setShopCatalogItemStatus } from '../domain/shop/usecases/setShopCatalogItemStatus';
import { updateShopCatalogItem } from '../domain/shop/usecases/updateShopCatalogItem';
import {
    createShopItem,
    listAllShopItems,
    setShopItemStatus,
    updateShopItem,
} from '../lib/supabase/shopAdminService';

type AdminFeedback = {
  severity: 'success' | 'error' | 'info';
  message: string;
};

type UseAdminShopCatalogResult = {
  items: ShopItem[];
  loading: boolean;
  submitting: boolean;
  feedback: AdminFeedback | null;
  statusFilter: ShopItemStatusFilter;
  categoryFilter: ShopItemCategory | 'all';
  sortOption: ShopItemSortOption;
  setStatusFilter: (value: ShopItemStatusFilter) => void;
  setCategoryFilter: (value: ShopItemCategory | 'all') => void;
  setSortOption: (value: ShopItemSortOption) => void;
  loadItems: () => Promise<void>;
  createItem: (payload: CreateShopItemPayload) => Promise<{ ok: boolean; error: string | null; fieldErrors?: Record<string, string> }>;
  updateItem: (payload: UpdateShopItemPayload) => Promise<{ ok: boolean; error: string | null; fieldErrors?: Record<string, string> }>;
  toggleStatus: (itemId: string, isActive: boolean) => Promise<void>;
  clearFeedback: () => void;
};

function sortItems(items: ShopItem[], sortOption: ShopItemSortOption): ShopItem[] {
  const next = [...items];

  switch (sortOption) {
    case 'updated_asc':
      return next.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case 'price_asc':
      return next.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return next.sort((a, b) => b.price - a.price);
    case 'name_asc':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'updated_desc':
    default:
      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function useAdminShopCatalog(): UseAdminShopCatalogResult {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<ShopItemStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ShopItemCategory | 'all'>('all');
  const [sortOption, setSortOption] = useState<ShopItemSortOption>('updated_desc');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const result = await listAllShopItems();
    setLoading(false);

    if (result.error || !result.data) {
      setFeedback({ severity: 'error', message: result.error?.message ?? 'Falha ao carregar catalogo administrativo.' });
      return;
    }

    setItems(result.data);
  }, []);

  const createItemAction = useCallback(async (payload: CreateShopItemPayload) => {
    setSubmitting(true);
    const result = await createShopCatalogItem({ createShopItem }, payload);
    setSubmitting(false);

    if (!result.ok) {
      setFeedback({ severity: 'error', message: result.error ?? 'Falha ao criar item.' });
      return { ok: false, error: result.error, fieldErrors: result.fieldErrors as Record<string, string> | undefined };
    }

    setFeedback({ severity: 'success', message: 'Item criado com sucesso.' });
    await loadItems();
    return { ok: true, error: null };
  }, [loadItems]);

  const updateItemAction = useCallback(async (payload: UpdateShopItemPayload) => {
    setSubmitting(true);
    const result = await updateShopCatalogItem({ updateShopItem }, payload);
    setSubmitting(false);

    if (!result.ok) {
      setFeedback({ severity: 'error', message: result.error ?? 'Falha ao atualizar item.' });
      return { ok: false, error: result.error, fieldErrors: result.fieldErrors as Record<string, string> | undefined };
    }

    setFeedback({ severity: 'success', message: 'Item atualizado com sucesso.' });
    await loadItems();
    return { ok: true, error: null };
  }, [loadItems]);

  const toggleStatus = useCallback(async (itemId: string, isActive: boolean) => {
    setSubmitting(true);
    const result = await setShopCatalogItemStatus({ setShopItemStatus }, { itemId, isActive });
    setSubmitting(false);

    if (!result.ok) {
      setFeedback({ severity: 'error', message: result.error ?? 'Falha ao alterar status do item.' });
      return;
    }

    setFeedback({
      severity: 'success',
      message: isActive ? 'Item ativado com sucesso.' : 'Item desativado com sucesso.',
    });

    await loadItems();
  }, [loadItems]);

  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const statusMatch = statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'inactive' && !item.isActive);

      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

      return statusMatch && categoryMatch;
    });

    return sortItems(filtered, sortOption);
  }, [categoryFilter, items, sortOption, statusFilter]);

  return {
    items: filteredAndSortedItems,
    loading,
    submitting,
    feedback,
    statusFilter,
    categoryFilter,
    sortOption,
    setStatusFilter,
    setCategoryFilter,
    setSortOption,
    loadItems,
    createItem: createItemAction,
    updateItem: updateItemAction,
    toggleStatus,
    clearFeedback: () => setFeedback(null),
  };
}
