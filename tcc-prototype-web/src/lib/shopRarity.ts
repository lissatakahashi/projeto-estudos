import type { ChipProps } from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';

type ShopRarityPresentation = {
  label: string;
  color: ChipProps['color'];
  sx?: SxProps<Theme>;
};

const EPIC_RARITY_SX: SxProps<Theme> = {
  bgcolor: '#7E57C2',
  color: '#FFFFFF',
  '& .MuiChip-label': {
    color: '#FFFFFF',
  },
};

function normalizeRarity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getShopRarityPresentation(rarity: string): ShopRarityPresentation {
  const normalizedRarity = normalizeRarity(rarity);

  if (normalizedRarity === 'common' || normalizedRarity === 'comum') {
    return { label: 'Comum', color: 'default' };
  }

  if (normalizedRarity === 'rare' || normalizedRarity === 'raro') {
    return { label: 'Raro', color: 'primary' };
  }

  if (normalizedRarity === 'epic' || normalizedRarity === 'epico') {
    return { label: 'Épico', color: 'secondary', sx: EPIC_RARITY_SX };
  }

  if (normalizedRarity === 'legendary' || normalizedRarity === 'lendario') {
    return { label: 'Lendário', color: 'warning' };
  }

  return { label: rarity, color: 'default' };
}
