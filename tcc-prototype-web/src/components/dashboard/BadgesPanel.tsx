import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import React from 'react';
import type { Badge, UserBadge } from '../../domain/badges/types/badge';

type BadgesPanelProps = {
  badges: Badge[];
  userBadges: UserBadge[];
  loading?: boolean;
};

function findUserBadgeEntry(userBadges: UserBadge[], badgeId: string): UserBadge | null {
  return userBadges.find((entry) => entry.badgeId === badgeId) ?? null;
}

const categoryLabelByKey: Record<Badge['category'], string> = {
  study: 'Estudo',
  economy: 'Economia',
  customization: 'Personalização',
  pet: 'Personagem',
};

const BadgesPanel: React.FC<BadgesPanelProps> = ({ badges, userBadges, loading = false }) => {
  const earnedCount = userBadges.length;

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Conquistas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading
                ? 'Carregando insígnias...'
                : `${earnedCount} de ${badges.length} insígnia(s) desbloqueada(s)`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {badges.map((badge) => {
              const earnedEntry = findUserBadgeEntry(userBadges, badge.badgeId);
              const earned = Boolean(earnedEntry);

              return (
                <Box
                  key={badge.badgeId}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: earned ? 'success.light' : 'divider',
                    bgcolor: earned ? 'success.50' : 'background.default',
                    opacity: earned ? 1 : 0.72,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    {earned ? (
                      <EmojiEventsRounded color="success" fontSize="small" />
                    ) : (
                      <LockRounded color="disabled" fontSize="small" />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {badge.name}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {badge.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" variant="outlined" label={categoryLabelByKey[badge.category]} />
                    {earned && earnedEntry?.earnedAt && (
                      <Chip
                        size="small"
                        color="success"
                        label={`Conquistada em ${new Date(earnedEntry.earnedAt).toLocaleDateString('pt-BR')}`}
                      />
                    )}
                    {!earned && <Chip size="small" label="Bloqueada" />}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BadgesPanel;
