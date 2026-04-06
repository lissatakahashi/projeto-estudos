import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import BadgesPanel from '../../components/dashboard/BadgesPanel';
import { useDashboardProgress } from '../../hooks/useDashboardProgress';
import { useAuthSession } from '../../lib/supabase/hooks';
import { useBadgeStore } from '../../state/useBadgeStore';
import { useMotivationalFeedbackStore } from '../../state/useMotivationalFeedbackStore';

function formatSessionStatus(status: string): string {
  if (status === 'completed') return 'Concluída';
  if (status === 'invalidated') return 'Invalidada';
  return 'Interrompida';
}

function getSessionStatusColor(status: string): 'success' | 'warning' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'invalidated') return 'warning';
  return 'default';
}

function formatMinutesFromSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)} min`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Ainda não há sessões concluídas';
  }

  return new Date(value).toLocaleString('pt-BR');
}

const DashboardPage: React.FC = () => {
  const session = useAuthSession();
  const userId = session?.user?.id ?? null;
  const { data, loading, error, refresh } = useDashboardProgress(userId);
  const publishEvent = useMotivationalFeedbackStore((s) => s.publishEvent);
  const badges = useBadgeStore((s) => s.badges);
  const userBadges = useBadgeStore((s) => s.userBadges);
  const badgesLoading = useBadgeStore((s) => s.loading);
  const hasSentEmptyFeedbackRef = useRef(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.isEmpty && !hasSentEmptyFeedbackRef.current) {
      publishEvent('dashboard_empty', {}, { dedupeKey: `dashboard_empty:${userId ?? 'anonymous'}` });
      hasSentEmptyFeedbackRef.current = true;
    }

    if (!data.isEmpty) {
      hasSentEmptyFeedbackRef.current = false;
    }
  }, [data, publishEvent, userId]);

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Dashboard de Progresso
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Faça login para visualizar suas métricas reais de estudo, moedas e evolução gamificada.
              </Typography>
              <Box>
                <Button component={RouterLink} to="/login" variant="contained">
                  Entrar na conta
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ py: 10, display: 'grid', placeItems: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress aria-label="Carregando dashboard" />
            <Typography variant="body2" color="text.secondary">
              Carregando progresso acadêmico...
            </Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
        <Stack spacing={2}>
          <Alert severity="error">{error ?? 'Não foi possível carregar o dashboard.'}</Alert>
          <Box>
            <Button onClick={() => { void refresh(); }} variant="outlined">
              Tentar novamente
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  const weeklyCompletedSessions = data.recentProgress.reduce((sum, point) => sum + point.completedSessions, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Dashboard de Progresso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Acompanhe sua evolução em foco, economia gamificada e engajamento recente.
          </Typography>
        </Box>

        {data.isEmpty && (
          <Alert
            severity="info"
            action={(
              <Button component={RouterLink} to="/pomodoro" color="inherit" size="small">
                Iniciar primeira sessão
              </Button>
            )}
          >
            Complete sua primeira sessão para começar a acompanhar seu progresso.
          </Alert>
        )}

        {!data.isEmpty && data.metrics.completedFocusSessionsCount === 1 && (
          <Alert severity="success">
            Primeira conquista registrada: sua primeira sessao de foco concluida.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Sessões concluídas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.metrics.completedFocusSessionsCount}</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Tempo total estudado</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMinutesFromSeconds(data.metrics.totalFocusTimeSeconds)}</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Saldo atual</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{data.metrics.currentWalletBalance} moedas</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Moedas ganhas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.metrics.totalCoinsEarned}</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Itens comprados</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.metrics.totalItemsPurchased}</Typography>
            </CardContent>
          </Card>
        </Box>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Resumo de progresso recente</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip label={`Sequência de estudos: ${data.metrics.recentStudyStreakDays} dia(s)`} color="primary" variant="outlined" />
              <Chip label={`Última sessão concluída: ${formatDateTime(data.metrics.lastCompletedSessionAt)}`} variant="outlined" />
              {data.currentCycleProgress && (
                <Chip
                  label={`Ciclo atual: ${data.currentCycleProgress.cycleIndex} • sessão ${data.currentCycleProgress.focusSequenceIndex}`}
                  variant="outlined"
                />
              )}
            </Stack>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Progresso dos últimos 7 dias: {weeklyCompletedSessions} sessão(ões) concluída(s)
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <BadgesPanel badges={badges} userBadges={userBadges} loading={badgesLoading} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '1fr 1fr',
            },
            gap: 2,
          }}
        >
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Últimas 5 sessões</Typography>
            {data.recentSessions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sem sessões registradas ainda.
              </Typography>
            ) : (
              <List disablePadding>
                {data.recentSessions.map((sessionItem, index) => (
                  <React.Fragment key={sessionItem.sessionId}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={`${formatMinutesFromSeconds(sessionItem.actualDurationSeconds)} • ${new Date(sessionItem.endedAt).toLocaleString('pt-BR')}`}
                        secondary={`Planejado: ${formatMinutesFromSeconds(sessionItem.plannedDurationSeconds)}`}
                      />
                      <Chip
                        label={formatSessionStatus(sessionItem.status)}
                        color={getSessionStatusColor(sessionItem.status)}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < data.recentSessions.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Atividade recente</Typography>
            {data.recentActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sua atividade aparecerá aqui após as primeiras interações.
              </Typography>
            ) : (
              <List disablePadding>
                {data.recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={activity.title}
                        secondary={`${activity.description} • ${new Date(activity.createdAt).toLocaleString('pt-BR')}`}
                      />
                      {activity.coinsDelta !== 0 && (
                        <Chip
                          size="small"
                          color={activity.coinsDelta >= 0 ? 'success' : 'warning'}
                          label={`${activity.coinsDelta >= 0 ? '+' : ''}${activity.coinsDelta} moedas`}
                        />
                      )}
                    </ListItem>
                    {index < data.recentActivities.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
};

export default DashboardPage;
