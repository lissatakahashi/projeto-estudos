import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import './about.css';

const Icon: React.FC<{emoji: string; label: string}> = ({ emoji, label }) => (
  <span role="img" aria-hidden={false} aria-label={label} className="about-icon">
    {emoji}
  </span>
);

const AboutPage: React.FC = () => {
  return (
    <main id="about-main" className="about-root" aria-labelledby="about-title">
      <Box component="header" sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.paper' }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Typography id="about-title" component="h1" variant="h4" sx={{ mb: 1 }}>
            Sobre o Projeto
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Conheça a motivação, metodologia e quem está por trás desta plataforma.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button component={RouterLink} to="/" variant="outlined" color="inherit" aria-label="Voltar para a página inicial">
              ← Voltar à home
            </Button>
            <Button component={RouterLink} to="/metodologia" variant="contained" color="primary" aria-label="Conhecer a metodologia">
              Conheça a metodologia
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box component="section" sx={{ py: 4 }} aria-labelledby="missao-title">
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography id="missao-title" component="h2" variant="h6" sx={{ mb: 1 }}>Missão e Objetivos</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Nossa missão é ajudar estudantes a vencer a procrastinação e construir hábitos de estudo saudáveis por meio de ciclos de foco (Pomodoro) aliados a um sistema de recompensas motivador.
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Objetivos gerais</Typography>
              <ul className="about-list">
                <li>Aumentar a concentração em sessões curtas e produtivas.</li>
                <li>Promover consistência através de feedback e recompensas.</li>
                <li>Fornecer ferramentas para personalização do ambiente virtual.</li>
              </ul>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Objetivos específicos</Typography>
              <ul className="about-list">
                <li>Reduzir distrações com timers simples e foco na tarefa.</li>
                <li>Recompensar progresso com moedas e itens personalizáveis.</li>
                <li>Oferecer métricas claras de progresso ao estudante.</li>
              </ul>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper elevation={0} className="about-card" sx={{ p: 3 }}>
                <Typography variant="h6">Por que Pomodoro + Gamificação?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  O método Pomodoro estrutura o tempo em blocos crescendo a eficiência. A gamificação adiciona micro-recompensas que tornam a prática consistente e motivadora.
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Icon emoji="⏱️" label="Cronômetro"/><Typography>25 minutos de estudo + pausas</Typography></Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Icon emoji="🪙" label="Moedas"/><Typography>Moedas por ciclos concluídos</Typography></Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Icon emoji="🏆" label="Conquistas"/><Typography>Conquistas por consistência</Typography></Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box component="section" sx={{ py: 4, bgcolor: 'background.default' }} aria-labelledby="como-title">
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Typography id="como-title" component="h2" variant="h6" sx={{ mb: 2 }}>Como Funciona a Plataforma</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                O usuário inicia um ciclo Pomodoro (normalmente 25 minutos). Ao completar, recebe moedas e eventualmente desbloqueia badges. Pequenas pausas ajudam a recuperação e um intervalo maior conclui o ciclo.
              </Typography>
              <ol className="about-steps">
                <li>Iniciar sessão de estudo.</li>
                <li>Manter foco durante o Pomodoro.</li>
                <li>Fazer pausas curtas e retomar.</li>
                <li>Trocar moedas por itens e personalizar o ambiente.</li>
              </ol>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="subtitle1">Recursos</Typography>
                <ul className="about-list">
                  <li>Timers simples e visíveis</li>
                  <li>Sistema de recompensas e loja</li>
                  <li>Perfil com badges e histórico</li>
                  <li>Configurações de personalização</li>
                </ul>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box component="section" sx={{ py: 4 }} aria-labelledby="diferenciais-title">
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Typography id="diferenciais-title" component="h2" variant="h6" sx={{ mb: 2 }}>Diferenciais</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="subtitle1">Personalização</Typography>
                <Typography variant="body2" color="text.secondary">Ambiente e recompensas adaptáveis ao estilo do estudante.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="subtitle1">Feedback</Typography>
                <Typography variant="body2" color="text.secondary">Métricas simples de progresso para manter a motivação.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2 }}>
                <Typography variant="subtitle1">Foco no aluno</Typography>
                <Typography variant="body2" color="text.secondary">Projetado para estudos, não distrações — ferramentas minimalistas.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Box component="section" sx={{ py: 4, bgcolor: 'background.paper' }} aria-labelledby="equipe-title">
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Typography id="equipe-title" component="h2" variant="h6" sx={{ mb: 2 }}>Autora</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 64, height: 64 }}>LT</Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="body1">Desenvolvido por Lissa Takahashi.</Typography>
              <Typography variant="body2" color="text.secondary">Para suporte ou feedback: <a href="mailto:suporte@exemplo.com">suporte@exemplo.com</a></Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </main>
  );
};

export default AboutPage;
