import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
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
import { useWalletStore } from '../../state/useWalletStore';

const rarityColorByKey: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning'> = {
  common: 'default',
  rare: 'primary',
  epic: 'secondary',
  legendary: 'warning',
};

const epicRaritySx = {
  bgcolor: '#7E57C2',
  color: '#FFFFFF',
  '& .MuiChip-label': {
    color: '#FFFFFF',
  },
};

const ShopPage: React.FC = () => {
  const userId = useShopStore((s) => s.userId);
  const items = useShopStore((s) => s.items);
  const inventory = useShopStore((s) => s.inventory);
  const loadingCatalog = useShopStore((s) => s.loadingCatalog);
  const loadingInventory = useShopStore((s) => s.loadingInventory);
  const pendingPurchaseByItemId = useShopStore((s) => s.pendingPurchaseByItemId);
  const error = useShopStore((s) => s.error);
  const feedback = useShopStore((s) => s.feedback);
  const loadCatalog = useShopStore((s) => s.loadCatalog);
  const loadInventory = useShopStore((s) => s.loadInventory);
  const purchaseItem = useShopStore((s) => s.purchaseItem);
  const clearFeedback = useShopStore((s) => s.clearFeedback);
  const isOwned = useShopStore((s) => s.isOwned);

  const walletBalance = useWalletStore((s) => s.balance);
  const walletLoading = useWalletStore((s) => s.loading);

  useEffect(() => {
    void loadCatalog();
    if (userId) {
      void loadInventory();
    }
  }, [loadCatalog, loadInventory, userId]);

  useEffect(() => {
    return () => {
      clearFeedback();
    };
  }, [clearFeedback]);

  const inventorySize = inventory.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Loja de Recompensas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Troque moedas obtidas nas sessões de estudo por itens de personalização do seu ambiente.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Chip
            color="success"
            variant="outlined"
            label={walletLoading ? 'Carteira: carregando...' : `Saldo atual: ${walletBalance} moedas`}
          />
          <Chip variant="outlined" label={`Itens no inventário: ${inventorySize}`} />
          {userId ? (
            <Chip color="info" variant="outlined" label="Conta autenticada" />
          ) : (
            <Chip color="warning" variant="outlined" label="Entre na conta para comprar" />
          )}
        </Stack>

        {!userId && (
          <Alert severity="info">
            Voce pode explorar o catalogo sem entrar, mas a compra exige autenticacao.
            {' '}
            <Button component={RouterLink} to="/login" size="small">
              Entrar agora
            </Button>
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            action={(
              <Button color="inherit" size="small" onClick={() => { void loadCatalog(); }}>
                Tentar novamente
              </Button>
            )}
          >
            {error}
          </Alert>
        )}

        {feedback && (
          <Alert severity={feedback.severity} onClose={clearFeedback}>
            {feedback.message}
          </Alert>
        )}

        {loadingCatalog ? (
          <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Carregando catalogo da loja" />
          </Box>
        ) : items.length === 0 ? (
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Catálogo temporariamente vazio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nenhum item ativo foi encontrado no momento. Tente atualizar para recarregar os dados da loja.
                </Typography>
                <Box>
                  <Button variant="contained" onClick={() => { void loadCatalog(); }}>
                    Atualizar catálogo
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : (
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
            {items.map((item) => {
              const owned = isOwned(item.itemId);
              const pending = Boolean(pendingPurchaseByItemId[item.itemId]);
              const hasInsufficientBalance = !walletLoading && walletBalance < item.price;
              const disabled = pending || owned || !userId || hasInsufficientBalance;

              const buttonLabel = (() => {
                if (pending) return 'Processando compra...';
                if (!userId) return 'Entre para comprar';
                if (owned) return 'Item adquirido';
                if (hasInsufficientBalance) return 'Saldo insuficiente';
                return 'Comprar item';
              })();

              return (
                <Card
                  key={item.itemId}
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 260,
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {item.name}
                      </Typography>
                      <Chip
                        size="small"
                        color={rarityColorByKey[item.rarity] ?? 'default'}
                        label={item.rarity}
                        sx={{
                          textTransform: 'capitalize',
                          ...(item.rarity === 'epic' ? epicRaritySx : {}),
                        }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" variant="outlined" label={item.category} sx={{ textTransform: 'capitalize' }} />
                      <Chip size="small" color="success" label={`${item.price} moedas`} />
                      {owned && <Chip size="small" color="info" label="Já no inventário" />}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {item.description}
                    </Typography>

                    {item.imageUrl && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Referência visual disponivel para o item.
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      fullWidth
                      variant={disabled ? 'outlined' : 'contained'}
                      disabled={disabled}
                      onClick={() => {
                        void purchaseItem(item.itemId);
                      }}
                      aria-label={`Comprar item ${item.name}`}
                    >
                      {buttonLabel}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {userId && loadingInventory && (
          <Alert severity="info">Atualizando inventario apos alteracoes...</Alert>
        )}
      </Stack>
    </Container>
  );
};

export default ShopPage;
