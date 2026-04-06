import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const year = new Date().getFullYear();

const Footer: React.FC = () => (
  <Box component="footer" sx={{ bgcolor: 'background.paper', borderTop: (t) => `1px solid ${t.palette.divider}`, py: { xs: 6, md: 8 } }}>
    <Container>
      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Produto
          </Typography>
          <nav aria-label="Produto">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li>
                <Link component={RouterLink} to="/pomodoro" color="text.secondary">
                  Pomodoro
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/shop" color="text.secondary">
                  Loja
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/inventory" color="text.secondary">
                  Inventário
                </Link>
              </li>
            </ul>
          </nav>
        </Grid>

        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Recursos
          </Typography>
          <nav aria-label="Recursos">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li>
                <Link component={RouterLink} to="/dashboard" color="text.secondary">
                  Histórico
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/dashboard" color="text.secondary">
                  Badges
                </Link>
              </li>
            </ul>
          </nav>
        </Grid>

        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Institucional
          </Typography>
          <nav aria-label="Institucional">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li>
                <Link component={RouterLink} to="/about" color="text.secondary">
                  Sobre
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/metodologia" color="text.secondary">
                  Metodologia
                </Link>
              </li>
            </ul>
          </nav>
        </Grid>

        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Legal
          </Typography>
          <nav aria-label="Legal">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li>
                <Link href="/politica-privacidade.html" color="text.secondary">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/terms" color="text.secondary">
                  Termos
                </Link>
              </li>
            </ul>
          </nav>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2, fontSize: 12, color: 'text.secondary' }}>
        <div>© {year} tcc-prototype. Todos os direitos reservados.</div>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Link href="/politica-privacidade.html" color="text.secondary">
            Política de Privacidade
          </Link>
          <Link component={RouterLink} to="/terms" color="text.secondary">
            Termos de Uso
          </Link>
        </Box>
      </Box>
    </Container>
  </Box>
);

export default Footer;
