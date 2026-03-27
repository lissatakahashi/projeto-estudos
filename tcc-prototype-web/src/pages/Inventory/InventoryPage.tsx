import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useShopStore } from '../../state/useShopStore';

const InventoryPage: React.FC = () => {
  const userId = useShopStore((s) => s.userId);
  const inventory = useShopStore((s) => s.inventory);
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
        </Box>

        {!userId && (
          <Alert severity="info">
            Faca login para visualizar seu inventario.
            {' '}
            <Typography component={RouterLink} to="/login" sx={{ ml: 1, fontWeight: 600 }}>
              Ir para login
            </Typography>
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {userId && loadingInventory && (
          <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Carregando inventario" />
          </Box>
        )}

        {userId && !loadingInventory && inventory.length === 0 && (
          <Alert severity="info">
            Seu inventario esta vazio. Acesse a loja para adquirir itens.
          </Alert>
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
            {inventory.map((entry) => (
              <Card key={entry.inventoryEntryId} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {entry.item.name}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" variant="outlined" label={entry.item.category} sx={{ textTransform: 'capitalize' }} />
                    <Chip size="small" color="primary" label={entry.item.rarity} sx={{ textTransform: 'capitalize' }} />
                    <Chip size="small" color="success" label={`Qtd: ${entry.quantity}`} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {entry.item.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Adquirido em: {new Date(entry.acquiredAt).toLocaleString('pt-BR')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default InventoryPage;
