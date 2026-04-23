import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import React from 'react';
import {
    canFeedPetWithCurrentBalance,
    derivePetMoodState,
    FEED_PET_COST_POLICY,
    getPetFeedInsufficientFundsMessage,
    getPetVisualByMood,
} from '../../domain/pet/types/pet';
import { usePetStore } from '../../state/usePetStore';
import { useWalletStore } from '../../state/useWalletStore';

type PetStatusCardProps = {
  compact?: boolean;
};

const PetStatusCard: React.FC<PetStatusCardProps> = ({ compact = false }) => {
  const pet = usePetStore((s) => s.pet);
  const loading = usePetStore((s) => s.loading);
  const feeding = usePetStore((s) => s.feeding);
  const error = usePetStore((s) => s.error);
  const feedback = usePetStore((s) => s.feedback);
  const feedPet = usePetStore((s) => s.feedPet);
  const loadPetState = usePetStore((s) => s.loadPetState);
  const clearFeedback = usePetStore((s) => s.clearFeedback);
  const walletBalance = useWalletStore((s) => s.balance);

  const mood = pet ? derivePetMoodState(pet) : 'neutral';
  const visual = getPetVisualByMood(mood);
  const hasSufficientBalanceToFeed = canFeedPetWithCurrentBalance(walletBalance);
  const insufficientFundsMessage = getPetFeedInsufficientFundsMessage();
  const feedButtonHelperId = 'pet-feed-helper-text';

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, minHeight: compact ? 'unset' : 320 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Pet Virtual
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Alimente o pet para manter o estado de cuidado ativo no seu progresso de estudo.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              action={(
                <Button color="inherit" size="small" onClick={() => { void loadPetState(); }}>
                  Recarregar
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

          {!pet && loading && <LinearProgress aria-label="Carregando estado do pet" />}

          {!pet && !loading && (
            <Alert severity="info">
              O estado do pet será inicializado automaticamente ao carregar sua conta.
            </Alert>
          )}

          {pet && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography component="span" sx={{ fontSize: compact ? 40 : 56, lineHeight: 1 }}>
                  {visual.emoji}
                </Typography>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {pet.petName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tipo: {pet.petType}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip size="small" color={mood === 'hungry' ? 'warning' : 'success'} label={visual.label} />
                <Chip size="small" variant="outlined" label={`Fome: ${pet.hungerLevel}/100`} />
                <Chip size="small" variant="outlined" label={`Humor: ${pet.moodLevel}/100`} />
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Energia alimentar
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pet.hungerLevel}
                  color={pet.hungerLevel <= 30 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 999, mt: 0.75 }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                Última alimentação:{' '}
                {pet.lastFedAt ? new Date(pet.lastFedAt).toLocaleString('pt-BR') : 'ainda não alimentado'}
              </Typography>

              <Box>
                <Button
                  variant={hasSufficientBalanceToFeed ? 'contained' : 'outlined'}
                  color={hasSufficientBalanceToFeed ? 'primary' : 'warning'}
                  aria-describedby={!hasSufficientBalanceToFeed ? feedButtonHelperId : undefined}
                  disabled={feeding || loading}
                  onClick={() => {
                    void feedPet();
                  }}
                >
                  {feeding ? 'Alimentando...' : `Alimentar pet (${FEED_PET_COST_POLICY.coins} moedas)`}
                </Button>
                {!hasSufficientBalanceToFeed && (
                  <Typography
                    id={feedButtonHelperId}
                    variant="caption"
                    color="warning.main"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {insufficientFundsMessage}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Política: custo de {FEED_PET_COST_POLICY.coins} moedas por alimentação e cooldown de {FEED_PET_COST_POLICY.cooldownSeconds}s.
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PetStatusCard;
