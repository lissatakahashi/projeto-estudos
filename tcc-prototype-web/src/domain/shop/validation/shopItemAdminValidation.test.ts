import { describe, expect, it } from 'vitest';
import {
    normalizeShopItemFormValues,
    validateShopItemFormValues,
} from './shopItemAdminValidation';

describe('shopItemAdminValidation', () => {
  it('normalizes slug from name when slug is empty', () => {
    const normalized = normalizeShopItemFormValues({
      name: 'Tema Floresta CalmA',
      slug: '',
      description: 'Tema',
      price: 10,
      category: 'theme',
      rarity: 'common',
      imageUrl: null,
      isActive: true,
    });

    expect(normalized.slug).toBe('tema-floresta-calma');
  });

  it('validates positive integer price', () => {
    const errors = validateShopItemFormValues({
      name: 'Tema',
      slug: 'tema',
      description: 'Tema',
      price: 0,
      category: 'theme',
      rarity: 'common',
      imageUrl: null,
      isActive: true,
    });

    expect(errors.price).toMatch(/inteiro positivo/i);
  });

  it('validates required name and slug', () => {
    const errors = validateShopItemFormValues({
      name: '',
      slug: '',
      description: '',
      price: 10,
      category: 'theme',
      rarity: 'common',
      imageUrl: null,
      isActive: true,
    });

    expect(errors.name).toBeTruthy();
    expect(errors.slug).toBeTruthy();
  });
});
