import type { ShopItemCategory } from '../domain/shop/types/shop';

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getShopCategoryLabel(category: ShopItemCategory | string): string {
  const normalizedCategory = normalize(category);

  if (normalizedCategory === 'theme' || normalizedCategory === 'tema') {
    return 'Tema';
  }

  if (normalizedCategory === 'avatar') {
    return 'Avatar';
  }

  if (normalizedCategory === 'badge') {
    return 'Emblema';
  }

  if (normalizedCategory === 'decor' || normalizedCategory === 'decoracao') {
    return 'Decoração';
  }

  if (normalizedCategory === 'other' || normalizedCategory === 'outro') {
    return 'Outro';
  }

  return category;
}
