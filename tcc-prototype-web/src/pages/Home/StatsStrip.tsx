import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';

const stats = [
  { value: '12.4k', label: 'Sessões concluídas' },
  { value: '1,234h', label: 'Tempo focado' },
  { value: '45', label: 'Maior sequência' },
];

const StatsStrip: React.FC = () => (
  <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
    <Container>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center" alignItems="center">
          {stats.map((s) => (
            <Grid key={s.label} item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  </Box>
);

export default StatsStrip;
