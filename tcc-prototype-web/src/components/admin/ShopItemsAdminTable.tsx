import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import React from 'react';
import type { ShopItem } from '../../domain/shop/types/shop';
import { getShopRarityPresentation } from '../../lib/shopRarity';

type ShopItemsAdminTableProps = {
  items: ShopItem[];
  loading: boolean;
  onEdit: (item: ShopItem) => void;
  onToggleStatus: (item: ShopItem) => void;
};

const ShopItemsAdminTable: React.FC<ShopItemsAdminTableProps> = ({
  items,
  loading,
  onEdit,
  onToggleStatus,
}) => {
  if (!loading && items.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Nenhum item encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ajuste os filtros ou cadastre um novo item para iniciar o catalogo administrativo.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
      <Table size="small" aria-label="Tabela administrativa de itens da loja">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Preço</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Raridade</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const rarity = getShopRarityPresentation(item.rarity);

            return (
              <TableRow key={item.itemId} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{item.slug}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={rarity.label}
                    color={rarity.color}
                    sx={{ textTransform: 'capitalize', ...rarity.sx }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={item.isActive ? 'success' : 'default'}
                    label={item.isActive ? 'Ativo' : 'Inativo'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={() => onEdit(item)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color={item.isActive ? 'warning' : 'success'}
                      variant="contained"
                      onClick={() => onToggleStatus(item)}
                    >
                      {item.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ShopItemsAdminTable;
