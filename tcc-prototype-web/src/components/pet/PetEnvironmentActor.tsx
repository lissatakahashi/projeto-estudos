import { Box, Typography } from '@mui/material';
import React from 'react';
import { derivePetMoodState, getPetVisualByMood } from '../../domain/pet/types/pet';
import { usePetStore } from '../../state/usePetStore';

const PetEnvironmentActor: React.FC = () => {
  const pet = usePetStore((s) => s.pet);
  const loading = usePetStore((s) => s.loading);

  const mood = pet ? derivePetMoodState(pet) : 'neutral';
  const visual = getPetVisualByMood(mood);

  if (loading && !pet) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: '14%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          pointerEvents: 'none',
          px: 1.25,
          py: 0.75,
          borderRadius: 999,
          bgcolor: 'rgba(15,23,42,0.72)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
          Sincronizando pet...
        </Typography>
      </Box>
    );
  }

  if (!pet) {
    return null;
  }

  return (
    <Box
      aria-label="Personagem virtual dentro do ambiente"
      sx={{
        position: 'absolute',
        left: '50%',
        bottom: { xs: '25%', sm: '27%' },
        transform: 'translateX(-50%)',
        zIndex: 3,
        pointerEvents: 'none',
        display: 'grid',
        justifyItems: 'center',
      }}
    >
      <Box
        sx={{
          width: { xs: 80, sm: 102 },
          height: 12,
          borderRadius: 999,
          background: 'radial-gradient(circle, rgba(15,23,42,0.28) 0%, rgba(15,23,42,0) 72%)',
          mx: 'auto',
        }}
      />
      <Box
        sx={{
          mt: -1,
          width: { xs: 60, sm: 72 },
          height: { xs: 42, sm: 50 },
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.65)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(241,245,249,0.76) 100%)',
          boxShadow: '0 8px 18px rgba(15,23,42,0.12)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: { xs: 34, sm: 42 },
            lineHeight: 1,
            display: 'block',
            textAlign: 'center',
            width: '1em',
            transform: { xs: 'translateX(0.5px)', sm: 'translateX(1px)' },
          }}
        >
          {visual.emoji}
        </Typography>
      </Box>
    </Box>
  );
};

export default PetEnvironmentActor;
