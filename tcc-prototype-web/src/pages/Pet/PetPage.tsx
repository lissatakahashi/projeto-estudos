import { Box, Container, Stack, Typography } from '@mui/material';
import React from 'react';
import PetStatusCard from '../../components/pet/PetStatusCard';

const PetPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Personagem Virtual
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cuide do seu pet com alimentacao recorrente para manter a experiencia gamificada alinhada ao TCC.
          </Typography>
        </Box>

        <PetStatusCard />
      </Stack>
    </Container>
  );
};

export default PetPage;
