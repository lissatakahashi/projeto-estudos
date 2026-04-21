import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getShopRarityPresentation } from '../../lib/shopRarity';
import { useShopStore } from '../../state/useShopStore';

const InventoryPage: React.FC = () => {
  const userId = useShopStore((s) => s.userId);
  const inventory = useShopStore((s) => s.inventory);
  const inventoryStatus = useShopStore((s) => s.inventoryStatus);
  const loadingInventory = useShopStore((s) => s.loadingInventory);
  const error = useShopStore((s) => s.error);
  const loadInventory = useShopStore((s) => s.loadInventory);

  useEffect(() => {
    if (userId) {
      void loadInventory();
    }
  }, [loadInventory, userId]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Inventário
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Itens adquiridos na loja para personalização do ambiente gamificado.
          </Typography>
          {userId && (
            <Button component={RouterLink} to="/environment" variant="outlined" sx={{ mt: 2 }}>
              Ir para ambiente virtual
            </Button>
          )}
        </Box>

        {!userId && (
          <Alert severity="info">
            Faça login para visualizar seu inventário.
            {' '}
            <Typography component={RouterLink} to="/login" sx={{ ml: 1, fontWeight: 600 }}>
              Ir para login
            </Typography>
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {userId && loadingInventory && (
          <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Carregando inventário" />
          </Box>
        )}

        {userId && !loadingInventory && inventoryStatus === 'empty' && (
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Você ainda não possui itens
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conclua sessões Pomodoro, acumule moedas e compre itens na loja para começar sua personalização.
                </Typography>
                <Box>
                  <Button component={RouterLink} to="/shop" variant="contained">
                    Ir para loja
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {userId && inventory.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {inventory.map((entry) => {
              const rarityPresentation = getShopRarityPresentation(entry.item.rarity);

              return (
                <Card key={entry.inventoryEntryId} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  {entry.item.imageUrl && (
                    <CardMedia
                      component="img"
                      image={entry.item.imageUrl}
                      height="140"
                      alt={`Visual do item ${entry.item.name}`}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {entry.item.name}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" variant="outlined" label={entry.item.category} sx={{ textTransform: 'capitalize' }} />
                      <Chip
                        size="small"
                        color={rarityPresentation.color}
                        label={rarityPresentation.label}
                        sx={{
                          textTransform: 'capitalize',
                          ...rarityPresentation.sx,
                        }}
                      />
                      <Chip size="small" color="success" label={`Qtd: ${entry.quantity}`} />
                      <Chip
                        size="small"
                        color={entry.isEquipped ? 'success' : 'default'}
                        variant={entry.isEquipped ? 'filled' : 'outlined'}
                        label={entry.isEquipped ? 'Equipado' : 'Não equipado'}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {entry.item.description}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={0.75}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Status de personalização: {entry.isReadyForCustomization ? 'pronto para uso futuro' : 'aguardando disponibilidade'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Slot previsto: {entry.equipSlot ?? 'não definido'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Alvo previsto: {entry.appliedTarget ?? 'não definido'}
                      </Typography>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Adquirido em: {new Date(entry.acquiredAt).toLocaleString('pt-BR')}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default InventoryPage;
