import type { ShopItemFormFieldErrors, ShopItemFormValues } from '../types/adminShop';
import { SHOP_ITEM_CATEGORIES, SHOP_ITEM_RARITIES } from '../types/shop';

function removeAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function slugifyShopItemName(value: string): string {
  return removeAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizeShopItemFormValues(input: ShopItemFormValues): ShopItemFormValues {
  const normalizedSlug = slugifyShopItemName(input.slug || input.name);

  return {
    ...input,
    name: input.name.trim(),
    slug: normalizedSlug,
    description: input.description.trim(),
    imageUrl: input.imageUrl && input.imageUrl.trim().length > 0 ? input.imageUrl.trim() : null,
  };
}

export function validateShopItemFormValues(values: ShopItemFormValues): ShopItemFormFieldErrors {
  const normalized = normalizeShopItemFormValues(values);
  const errors: ShopItemFormFieldErrors = {};

  if (!normalized.name || normalized.name.length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres.';
  }

  if (!normalized.slug || normalized.slug.length < 2) {
    errors.slug = 'Slug invalido. Use ao menos 2 caracteres alfanumericos.';
  }

  if (!Number.isInteger(normalized.price) || normalized.price <= 0) {
    errors.price = 'Preco deve ser um numero inteiro positivo.';
  }

  if (!SHOP_ITEM_CATEGORIES.includes(normalized.category)) {
    errors.category = 'Categoria invalida para o catalogo.';
  }

  if (!SHOP_ITEM_RARITIES.includes(normalized.rarity)) {
    errors.rarity = 'Raridade invalida para o catalogo.';
  }

  if (normalized.imageUrl) {
    const isHttpUrl = /^https?:\/\//i.test(normalized.imageUrl);
    if (!isHttpUrl) {
      errors.imageUrl = 'URL da imagem deve iniciar com http:// ou https://';
    }
  }

  return errors;
}
