import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import type { ShopItemFormValues } from '../../domain/shop/types/adminShop';
import {
    SHOP_ITEM_CATEGORIES,
    SHOP_ITEM_RARITIES,
    type ShopItem,
} from '../../domain/shop/types/shop';
import {
    normalizeShopItemFormValues,
    validateShopItemFormValues,
} from '../../domain/shop/validation/shopItemAdminValidation';

type ShopItemFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  item: ShopItem | null;
  loading: boolean;
  onClose: () => void;
  onCreate: (payload: ShopItemFormValues) => Promise<{ ok: boolean; error: string | null; fieldErrors?: Record<string, string> }>;
  onUpdate: (payload: ShopItemFormValues) => Promise<{ ok: boolean; error: string | null; fieldErrors?: Record<string, string> }>;
};

const defaultFormValues: ShopItemFormValues = {
  name: '',
  slug: '',
  description: '',
  price: 1,
  category: 'other',
  rarity: 'common',
  imageUrl: null,
  isActive: true,
};

const ShopItemFormDialog: React.FC<ShopItemFormDialogProps> = ({
  open,
  mode,
  item,
  loading,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [values, setValues] = useState<ShopItemFormValues>(defaultFormValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && item) {
      setValues({
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        category: item.category,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
      });
      setFieldErrors({});
      setSubmitError(null);
      return;
    }

    setValues(defaultFormValues);
    setFieldErrors({});
    setSubmitError(null);
  }, [item, mode, open]);

  const title = mode === 'create' ? 'Novo item do catalogo' : 'Editar item do catalogo';

  const submitLabel = useMemo(() => {
    if (loading) {
      return mode === 'create' ? 'Criando...' : 'Salvando...';
    }
    return mode === 'create' ? 'Criar item' : 'Salvar alteracoes';
  }, [loading, mode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeShopItemFormValues(values);
    const nextErrors = validateShopItemFormValues(normalized);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors as Record<string, string>);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    const result = mode === 'create'
      ? await onCreate(normalized)
      : await onUpdate(normalized);

    if (!result.ok) {
      setSubmitError(result.error ?? 'Falha ao salvar item.');
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              label="Nome"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              required
              fullWidth
            />

            <TextField
              label="Slug"
              value={values.slug}
              onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))}
              error={Boolean(fieldErrors.slug)}
              helperText={fieldErrors.slug ?? 'Deixe em branco para gerar com base no nome.'}
              fullWidth
            />

            <TextField
              label="Descricao"
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              multiline
              minRows={3}
              fullWidth
            />

            <TextField
              label="Preco (moedas)"
              type="number"
              value={values.price}
              onChange={(event) => setValues((current) => ({ ...current, price: Number(event.target.value) }))}
              inputProps={{ min: 1, step: 1 }}
              error={Boolean(fieldErrors.price)}
              helperText={fieldErrors.price}
              required
              fullWidth
            />

            <FormControl fullWidth error={Boolean(fieldErrors.category)}>
              <InputLabel id="shop-item-category-label">Categoria</InputLabel>
              <Select
                labelId="shop-item-category-label"
                label="Categoria"
                value={values.category}
                onChange={(event) => setValues((current) => ({ ...current, category: event.target.value as ShopItemFormValues['category'] }))}
              >
                {SHOP_ITEM_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth error={Boolean(fieldErrors.rarity)}>
              <InputLabel id="shop-item-rarity-label">Raridade</InputLabel>
              <Select
                labelId="shop-item-rarity-label"
                label="Raridade"
                value={values.rarity}
                onChange={(event) => setValues((current) => ({ ...current, rarity: event.target.value as ShopItemFormValues['rarity'] }))}
              >
                {SHOP_ITEM_RARITIES.map((rarity) => (
                  <MenuItem key={rarity} value={rarity}>{rarity}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="URL da imagem"
              value={values.imageUrl ?? ''}
              onChange={(event) => {
                const rawValue = event.target.value;
                setValues((current) => ({
                  ...current,
                  imageUrl: rawValue.length > 0 ? rawValue : null,
                }));
              }}
              error={Boolean(fieldErrors.imageUrl)}
              helperText={fieldErrors.imageUrl}
              fullWidth
            />

            <FormControlLabel
              control={(
                <Switch
                  checked={values.isActive}
                  onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
                />
              )}
              label="Item ativo no catalogo publico"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ShopItemFormDialog;
