import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PetEnvironmentActor from '../../components/pet/PetEnvironmentActor';
import PetStatusCard from '../../components/pet/PetStatusCard';
import {
    ENVIRONMENT_SLOT_DEFINITIONS,
    type EnvironmentSlotName,
} from '../../domain/environment/types/environment';
import { getCompatibleInventoryItemsBySlot } from '../../domain/environment/usecases/getCompatibleInventoryItemsBySlot';
import { getShopRarityPresentation } from '../../lib/shopRarity';
import { useEnvironmentStore } from '../../state/useEnvironmentStore';
import { usePetStore } from '../../state/usePetStore';
import { useShopStore } from '../../state/useShopStore';

const slotLayoutByName: Record<EnvironmentSlotName, { top: string; left: string; width: string; height: string }> = {
  background: { top: '4%', left: '4%', width: '92%', height: '90%' },
  wall: { top: '12%', left: '18%', width: '64%', height: '28%' },
  window_area: { top: '12%', left: '66%', width: '22%', height: '24%' },
  shelf: { top: '34%', left: '18%', width: '22%', height: '14%' },
  desk: { top: '54%', left: '24%', width: '52%', height: '18%' },
  decoration_left: { top: '54%', left: '8%', width: '14%', height: '18%' },
  decoration_right: { top: '54%', left: '78%', width: '14%', height: '18%' },
  floor: { top: '76%', left: '10%', width: '80%', height: '16%' },
};

const hiddenSlotsOnScene: EnvironmentSlotName[] = ['desk'];

const EnvironmentPage: React.FC = () => {
  const userId = useShopStore((s) => s.userId);
  const inventory = useShopStore((s) => s.inventory);
  const inventoryStatus = useShopStore((s) => s.inventoryStatus);
  const loadingInventory = useShopStore((s) => s.loadingInventory);
  const loadInventory = useShopStore((s) => s.loadInventory);

  const configuration = useEnvironmentStore((s) => s.configuration);
  const status = useEnvironmentStore((s) => s.status);
  const loadingEnvironment = useEnvironmentStore((s) => s.loading);
  const selectedSlot = useEnvironmentStore((s) => s.selectedSlot);
  const pendingBySlot = useEnvironmentStore((s) => s.pendingBySlot);
  const error = useEnvironmentStore((s) => s.error);
  const feedback = useEnvironmentStore((s) => s.feedback);
  const setSelectedSlot = useEnvironmentStore((s) => s.setSelectedSlot);
  const loadEnvironment = useEnvironmentStore((s) => s.loadEnvironment);
  const equipSlotWithInventoryItem = useEnvironmentStore((s) => s.equipSlotWithInventoryItem);
  const clearSlot = useEnvironmentStore((s) => s.clearSlot);
  const clearFeedback = useEnvironmentStore((s) => s.clearFeedback);
  const loadPetState = usePetStore((s) => s.loadPetState);

  useEffect(() => {
    if (userId) {
      void loadInventory();
      void loadEnvironment();
      void loadPetState();
    }
  }, [loadEnvironment, loadInventory, loadPetState, userId]);

  useEffect(() => {
    return () => {
      clearFeedback();
    };
  }, [clearFeedback]);

  useEffect(() => {
    if (selectedSlot && hiddenSlotsOnScene.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, setSelectedSlot]);

  const inventoryByEntryId = useMemo(() => {
    return new Map(inventory.map((entry) => [entry.inventoryEntryId, entry]));
  }, [inventory]);

  const selectedSlotDefinition = ENVIRONMENT_SLOT_DEFINITIONS.find((slot) => slot.slotName === selectedSlot) ?? null;
  const sceneSlotDefinitions = ENVIRONMENT_SLOT_DEFINITIONS.filter((slot) => !hiddenSlotsOnScene.includes(slot.slotName));

  const compatibleItems = selectedSlot
    ? getCompatibleInventoryItemsBySlot(inventory, selectedSlot)
    : [];

  const equippedBackgroundEntry = configuration.bySlot.background
    ? inventoryByEntryId.get(configuration.bySlot.background.inventoryEntryId) ?? null
    : null;

  const equippedBackgroundImageUrl = equippedBackgroundEntry?.item.imageUrl ?? null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Ambiente Virtual
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Personalize seu ambiente de estudo aplicando itens do inventário em posições fixas e persistentes.
          </Typography>
        </Box>

        {!userId && (
          <Alert severity="info">
            Entre na conta para personalizar seu ambiente.
            {' '}
            <Typography component={RouterLink} to="/login" sx={{ ml: 1, fontWeight: 600 }}>
              Ir para login
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            action={(
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  void loadEnvironment();
                  void loadInventory();
                }}
              >
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

        {userId && (loadingInventory || loadingEnvironment) && (
          <Box sx={{ py: 5, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Carregando ambiente personalizado" />
          </Box>
        )}

        {userId && !loadingEnvironment && status !== 'error' && (
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Cenário de estudo
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Clique em uma posição para escolher o item compatível.
                </Typography>

                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: equippedBackgroundImageUrl
                      ? `linear-gradient(rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.24)), url(${equippedBackgroundImageUrl})`
                      : 'linear-gradient(180deg, rgba(231,245,255,1) 0%, rgba(246,250,255,1) 55%, rgba(235,242,231,1) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Pet em camada dedicada dentro do cenario para reforcar a composicao visual integrada. */}
                  <PetEnvironmentActor />

                  {sceneSlotDefinitions.map((slotDefinition) => {
                    const equipped = configuration.bySlot[slotDefinition.slotName];
                    const equippedInventoryItem = equipped
                      ? inventoryByEntryId.get(equipped.inventoryEntryId) ?? null
                      : null;
                    const layout = slotLayoutByName[slotDefinition.slotName];
                    const isSelected = selectedSlot === slotDefinition.slotName;
                    const isBackgroundSlot = slotDefinition.slotName === 'background';

                    return (
                      <Button
                        key={slotDefinition.slotName}
                        variant={isSelected ? 'contained' : 'outlined'}
                        color={isSelected ? 'primary' : 'inherit'}
                        onClick={() => setSelectedSlot(slotDefinition.slotName)}
                        aria-label={`Selecionar posição ${slotDefinition.label}`}
                        sx={{
                          position: 'absolute',
                          top: layout.top,
                          left: layout.left,
                          width: layout.width,
                          height: layout.height,
                          minWidth: 'unset',
                          p: 1,
                          zIndex: isBackgroundSlot ? 1 : 2,
                          borderStyle: isSelected ? 'solid' : 'dashed',
                          borderWidth: 1,
                          borderColor: isSelected ? 'primary.main' : 'rgba(30,41,59,0.35)',
                          bgcolor: isBackgroundSlot
                            ? (isSelected ? 'rgba(25,118,210,0.08)' : 'transparent')
                            : (isSelected ? 'rgba(25,118,210,0.12)' : 'rgba(255,255,255,0.45)'),
                          color: 'text.primary',
                          textTransform: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 0.5,
                          backdropFilter: isBackgroundSlot ? 'none' : 'blur(1px)',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {slotDefinition.label}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, textAlign: 'center' }}>
                          {equippedInventoryItem ? equippedInventoryItem.item.name : 'Posição vazia'}
                        </Typography>
                      </Button>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>

            <Stack spacing={2} sx={{ width: { xs: '100%', lg: 420 } }}>
              <PetStatusCard compact />

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Personalização por posição
                  </Typography>

                  {!selectedSlotDefinition && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Selecione uma posição no cenário para listar os itens compatíveis do inventário.
                    </Alert>
                  )}

                  {selectedSlotDefinition && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {selectedSlotDefinition.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedSlotDefinition.description}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                          {selectedSlotDefinition.acceptedItemCategories.map((category) => (
                            <Chip
                              key={category}
                              size="small"
                              variant="outlined"
                              label={`Categoria: ${category}`}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {configuration.bySlot[selectedSlotDefinition.slotName] && (
                        <Button
                          variant="outlined"
                          color="warning"
                          disabled={pendingBySlot[selectedSlotDefinition.slotName]}
                          onClick={() => {
                            void clearSlot(selectedSlotDefinition.slotName);
                          }}
                        >
                          Remover item equipado desta posição
                        </Button>
                      )}

                      {compatibleItems.length === 0 && (
                        <Alert severity="info">
                          Você não possui itens compatíveis para esta posição.
                          {' '}
                          <Button component={RouterLink} to="/shop" size="small">
                            Ir para loja
                          </Button>
                        </Alert>
                      )}

                      {compatibleItems.map((entry) => {
                        const currentlyEquipped = configuration.bySlot[selectedSlotDefinition.slotName]?.inventoryEntryId === entry.inventoryEntryId;
                        const rarityPresentation = getShopRarityPresentation(entry.item.rarity);

                        return (
                          <Card key={entry.inventoryEntryId} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Stack spacing={1.5}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {entry.item.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                  <Chip size="small" label={entry.item.category} />
                                  <Chip
                                    size="small"
                                    color={rarityPresentation.color}
                                    label={rarityPresentation.label}
                                    sx={rarityPresentation.sx}
                                  />
                                  {entry.item.environmentSlot && (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={`Posição recomendada: ${entry.item.environmentSlot}`}
                                    />
                                  )}
                                </Stack>

                                <Typography variant="caption" color="text.secondary">
                                  {entry.item.description}
                                </Typography>

                                <Button
                                  variant={currentlyEquipped ? 'outlined' : 'contained'}
                                  disabled={currentlyEquipped || pendingBySlot[selectedSlotDefinition.slotName]}
                                  onClick={() => {
                                    void equipSlotWithInventoryItem(selectedSlotDefinition.slotName, entry.inventoryEntryId);
                                  }}
                                >
                                  {currentlyEquipped ? 'Já equipado nesta posição' : 'Equipar nesta posição'}
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {inventoryStatus === 'empty' && (
                        <Alert severity="info">
                          Seu inventário está vazio. Compre itens para iniciar a personalização do ambiente.
                        </Alert>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default EnvironmentPage;
