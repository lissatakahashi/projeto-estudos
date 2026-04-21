import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import ShopItemFormDialog from '../../components/admin/ShopItemFormDialog';
import ShopItemsAdminTable from '../../components/admin/ShopItemsAdminTable';
import { SHOP_ITEM_CATEGORIES, type ShopItem } from '../../domain/shop/types/shop';
import { useAdminShopCatalog } from '../../hooks/useAdminShopCatalog';
import { useAuthSession } from '../../lib/supabase/hooks';

const ShopCatalogAdminPage: React.FC = () => {
  const session = useAuthSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  const {
    items,
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
    createItem,
    updateItem,
    toggleStatus,
    clearFeedback,
  } = useAdminShopCatalog();

  useEffect(() => {
    if (session?.user?.id) {
      void loadItems();
    }
  }, [loadItems, session?.user?.id]);

  const headerChips = useMemo(() => ([
    { label: `Total visível: ${items.length}` },
    { label: session?.user?.email ? `Sessão: ${session.user.email}` : 'Sessao nao autenticada' },
  ]), [items.length, session?.user?.email]);

  if (!session) {
    return (
      <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
        <Alert severity="warning">
          A área administrativa exige autenticação.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Administração de itens da loja
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cadastre, edite e ative/desative itens do catálogo real no Supabase.
          </Typography>
        </Box>

        <Alert severity="info">
          Controle de acesso neste estágio: área separada com autenticação obrigatória no front-end. Para ambiente de produção,
          aplique autorização forte no Supabase (RLS/policies por perfil admin).
        </Alert>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          {headerChips.map((chip) => (
            <Chip key={chip.label} label={chip.label} variant="outlined" />
          ))}
        </Stack>

        {feedback && (
          <Alert severity={feedback.severity} onClose={clearFeedback}>
            {feedback.message}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="admin-status-filter-label">Status</InputLabel>
            <Select
              labelId="admin-status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Ativos</MenuItem>
              <MenuItem value="inactive">Inativos</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="admin-category-filter-label">Categoria</InputLabel>
            <Select
              labelId="admin-category-filter-label"
              value={categoryFilter}
              label="Categoria"
              onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}
            >
              <MenuItem value="all">Todas</MenuItem>
              {SHOP_ITEM_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="admin-sort-label">Ordenação</InputLabel>
            <Select
              labelId="admin-sort-label"
              value={sortOption}
              label="Ordenacao"
              onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
            >
              <MenuItem value="updated_desc">Atualizados recentemente</MenuItem>
              <MenuItem value="updated_asc">Atualizados antigos</MenuItem>
              <MenuItem value="price_asc">Preço crescente</MenuItem>
              <MenuItem value="price_desc">Preço decrescente</MenuItem>
              <MenuItem value="name_asc">Ordem alfabética</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            onClick={() => {
              setEditingItem(null);
              setDialogOpen(true);
            }}
            disabled={submitting}
          >
            Novo item
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Carregando itens administrativos" />
          </Box>
        ) : (
          <ShopItemsAdminTable
            items={items}
            loading={loading}
            onEdit={(item) => {
              setEditingItem(item);
              setDialogOpen(true);
            }}
            onToggleStatus={(item) => {
              void toggleStatus(item.itemId, !item.isActive);
            }}
          />
        )}
      </Stack>

      <ShopItemFormDialog
        open={dialogOpen}
        mode={editingItem ? 'edit' : 'create'}
        item={editingItem}
        loading={submitting}
        onClose={() => {
          if (!submitting) {
            setDialogOpen(false);
            setEditingItem(null);
          }
        }}
        onCreate={createItem}
        onUpdate={async (payload) => {
          if (!editingItem) {
            return { ok: false, error: 'Item de edicao nao encontrado.' };
          }

          return updateItem({
            itemId: editingItem.itemId,
            ...payload,
          });
        }}
      />
    </Container>
  );
};

export default ShopCatalogAdminPage;
