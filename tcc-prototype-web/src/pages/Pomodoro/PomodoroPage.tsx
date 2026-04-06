import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_POMODORO_SETTINGS } from '../../domain/pomodoro/constants/pomodoroSettings';
import { getPomodoroInvalidationReasonLabel } from '../../domain/pomodoro/types/PomodoroInvalidation';
import type {
  PomodoroSettingsDraft,
  PomodoroSettingsErrors,
} from '../../domain/pomodoro/types/PomodoroSettings';
import { settingsToDraft } from '../../domain/pomodoro/types/PomodoroSettings';
import {
  normalizeSettingsDraftValue,
  validatePomodoroSettingsDraft,
} from '../../domain/pomodoro/validation/pomodoroSettingsValidation';
import { useDashboardProgress } from '../../hooks/useDashboardProgress';
import { useAuthSession } from '../../lib/supabase/hooks';
import { usePomodoroStore } from '../../state/usePomodoroStore';
import { useWalletStore } from '../../state/useWalletStore';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

const PomodoroPage: React.FC = () => {
  const session = useAuthSession();
  const userId = session?.user?.id ?? null;
  const dashboardProgress = useDashboardProgress(userId);

  const pomodoro = usePomodoroStore((s) => s.pomodoro);
  const cycleState = usePomodoroStore((s) => s.cycleState);
  const settings = usePomodoroStore((s) => s.settings);
  const settingsLoading = usePomodoroStore((s) => s.settingsLoading);
  const settingsSaving = usePomodoroStore((s) => s.settingsSaving);
  const settingsError = usePomodoroStore((s) => s.settingsError);
  const settingsSuccessMessage = usePomodoroStore((s) => s.settingsSuccessMessage);
  const completedFocusSessionsCount = usePomodoroStore((s) => s.completedFocusSessionsCount);
  const totalFocusStudySeconds = usePomodoroStore((s) => s.totalFocusStudySeconds);
  const startError = usePomodoroStore((s) => s.startError);
  const start = usePomodoroStore((s) => s.startPomodoro);
  const pause = usePomodoroStore((s) => s.pausePomodoro);
  const resume = usePomodoroStore((s) => s.resumePomodoro);
  const tick = usePomodoroStore((s) => s.tickPomodoro);
  const reset = usePomodoroStore((s) => s.resetPomodoro);
  const advanceToNextPhase = usePomodoroStore((s) => s.advanceToNextPhase);
  const penalize = usePomodoroStore((s) => s.penalizeLostFocus);
  const load = usePomodoroStore((s) => s.loadFromStorage);
  const loadSettings = usePomodoroStore((s) => s.loadSettings);
  const saveSettings = usePomodoroStore((s) => s.saveSettings);
  const clearSettingsFeedback = usePomodoroStore((s) => s.clearSettingsFeedback);
  const clearStartError = usePomodoroStore((s) => s.clearStartError);
  const clearExpiredSession = usePomodoroStore((s) => s.clearExpiredSession);
  const walletBalance = useWalletStore((s) => s.balance);
  const walletLoading = useWalletStore((s) => s.loading);
  const walletTransactions = useWalletStore((s) => s.transactions);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<PomodoroSettingsDraft>(settingsToDraft(DEFAULT_POMODORO_SETTINGS));
  const [fieldErrors, setFieldErrors] = useState<PomodoroSettingsErrors>({});
  const [inFlightAction, setInFlightAction] = useState<'start' | 'pause' | 'resume' | 'advance' | 'cancel' | null>(null);

  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    load();
    clearExpiredSession();
    void loadSettings();
    // visibility handlers to detect lost focus duration
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        if (hiddenAtRef.current) {
          const diffMs = Date.now() - hiddenAtRef.current;
          const diffSec = Math.round(diffMs / 1000);
          if (diffSec > 0) penalize(diffSec);
        }
        hiddenAtRef.current = null;
      }
    };

    const onBeforeUnload = () => {
      const state = usePomodoroStore.getState();
      const active = state.pomodoro;
      if (!active || active.status === 'finished' || active.mode !== 'focus') {
        return;
      }

      void state.invalidateActivePomodoro('page_unload');
    };

    const onPageHide = () => {
      onBeforeUnload();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      const state = usePomodoroStore.getState();
      const active = state.pomodoro;
      if (!active || active.status === 'finished' || active.mode !== 'focus') {
        return;
      }
      void state.invalidateActivePomodoro('component_unmount');
    };
  }, [clearExpiredSession, load, loadSettings, penalize]);

  useEffect(() => {
    let timer: number | undefined;
    if (pomodoro && pomodoro.status === 'running') {
      timer = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [pomodoro, tick]);

  useEffect(() => {
    if (!settingsOpen) {
      setDraft(settingsToDraft(settings));
      setFieldErrors({});
    }
  }, [settings, settingsOpen]);

  const runAction = async (
    action: 'start' | 'pause' | 'resume' | 'advance' | 'cancel',
    callback: () => Promise<void | boolean>,
  ) => {
    if (inFlightAction) {
      return;
    }

    setInFlightAction(action);
    try {
      await callback();
    } finally {
      setInFlightAction(null);
    }
  };

  const handleStart = async () => {
    await runAction('start', async () => {
      await start();
    });
  };

  const handlePause = async () => {
    await runAction('pause', pause);
  };

  const handleResume = async () => {
    await runAction('resume', resume);
  };

  const handleCancel = async () => {
    await runAction('cancel', reset);
  };

  const handleAdvancePhase = async () => {
    await runAction('advance', async () => {
      await advanceToNextPhase();
    });
  };

  const handleOpenSettings = () => {
    clearSettingsFeedback();
    setFieldErrors({});
    setDraft(settingsToDraft(settings));
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setFieldErrors({});
    setDraft(settingsToDraft(settings));
  };

  const handleDraftChange = (field: keyof PomodoroSettingsDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedValue = normalizeSettingsDraftValue(event.target.value);
    setDraft((prev) => ({ ...prev, [field]: normalizedValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveSettings = async () => {
    const validation = validatePomodoroSettingsDraft(draft);
    setFieldErrors(validation.errors);

    if (!validation.isValid || !validation.normalized) {
      return;
    }

    const saved = await saveSettings(validation.normalized);
    if (saved) {
      setSettingsOpen(false);
    }
  };

  const modeLabel = cycleState.phase === 'paused' ? `paused (${cycleState.activeMode})` : cycleState.phase;
  const displaySeconds = pomodoro ? pomodoro.remaining : cycleState.remainingSeconds;
  const plannedFocusLabel = `${settings.focusDurationMinutes} min`;
  const plannedShortBreakLabel = `${settings.shortBreakDurationMinutes} min`;
  const plannedLongBreakLabel = `${settings.longBreakDurationMinutes} min`;
  const focusCycleProgress = `${cycleState.focusSessionsCompletedInCycle}/${settings.cyclesBeforeLongBreak}`;
  const persistedCompletedFocusSessionsCount = dashboardProgress.data?.metrics.completedFocusSessionsCount;
  const persistedTotalFocusTimeMinutes = dashboardProgress.data?.metrics.totalFocusTimeMinutes;
  const displayedCompletedFocusSessionsCount = persistedCompletedFocusSessionsCount ?? completedFocusSessionsCount;
  const displayedStudiedMinutes = persistedTotalFocusTimeMinutes ?? Math.floor(totalFocusStudySeconds / 60);
  const latestWalletTransaction = walletTransactions[0];
  const hasActionInFlight = Boolean(inFlightAction);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }} elevation={2}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Pomodoro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Configure seu ciclo de foco e pausas para manter consistência acadêmica no método.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={handleOpenSettings} aria-label="Abrir configuracao do Pomodoro">
              Configurar sessão
            </Button>
          </Box>

          {settingsError && <Alert severity="warning">{settingsError}</Alert>}
          {settingsSuccessMessage && <Alert severity="success">{settingsSuccessMessage}</Alert>}
          {startError && <Alert severity="error" onClose={clearStartError}>{startError}</Alert>}

          <Box aria-live="polite">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                fontSize: { xs: '4rem', sm: '5.5rem', md: '6rem' },
                lineHeight: 1,
              }}
            >
              {formatTime(displaySeconds)}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Chip label={`Modo atual: ${modeLabel.replace('_', ' ')}`} color="primary" variant="outlined" />
              <Chip label={`Próximo modo: ${cycleState.nextMode.replace('_', ' ')}`} variant="outlined" />
              <Chip label={`Ciclo: ${settings.cyclesBeforeLongBreak} focos por pausa longa`} variant="outlined" />
              <Chip label={`Focos no ciclo: ${focusCycleProgress}`} variant="outlined" />
              <Chip label={`Focos concluidos validos: ${displayedCompletedFocusSessionsCount}`} variant="outlined" />
              <Chip label={`Tempo total estudado: ${displayedStudiedMinutes} min`} variant="outlined" />
              <Chip label={walletLoading ? 'Carteira: carregando...' : `Carteira: ${walletBalance} moedas`} color="success" variant="outlined" />
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Chip label={`Foco: ${plannedFocusLabel}`} />
            <Chip label={`Pausa curta: ${plannedShortBreakLabel}`} />
            <Chip label={`Pausa longa: ${plannedLongBreakLabel}`} />
          </Stack>

          <Box>
            {!pomodoro && (
              <Button
                onClick={handleStart}
                variant="contained"
                size="large"
                aria-label="Iniciar sessao Pomodoro"
                disabled={hasActionInFlight || settingsLoading}
              >
                {inFlightAction === 'start' ? 'Iniciando...' : 'Iniciar sessão'}
              </Button>
            )}
            {pomodoro && pomodoro.status === 'running' && (
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    onClick={handlePause}
                    variant="outlined"
                    aria-label="Pausar sessao Pomodoro"
                    fullWidth
                    disabled={hasActionInFlight}
                  >
                    {inFlightAction === 'pause' ? 'Pausando...' : 'Pausar'}
                  </Button>
                  <Button
                    onClick={handleAdvancePhase}
                    variant="contained"
                    aria-label="Avancar fase Pomodoro"
                    fullWidth
                    disabled={hasActionInFlight}
                  >
                    {inFlightAction === 'advance' ? 'Avancando...' : 'Avancar fase'}
                  </Button>
                </Stack>
                <Button
                  onClick={handleCancel}
                  variant="contained"
                  color="error"
                  aria-label="Cancelar sessao Pomodoro"
                  fullWidth
                  disabled={hasActionInFlight}
                >
                  {inFlightAction === 'cancel' ? 'Cancelando...' : 'Cancelar sessão'}
                </Button>
              </Stack>
            )}
            {pomodoro && pomodoro.status === 'paused' && (
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    onClick={handleResume}
                    variant="contained"
                    aria-label="Retomar sessao Pomodoro"
                    fullWidth
                    disabled={hasActionInFlight}
                  >
                    {inFlightAction === 'resume' ? 'Retomando...' : 'Retomar'}
                  </Button>
                  <Button
                    onClick={handleAdvancePhase}
                    variant="outlined"
                    aria-label="Avancar fase Pomodoro pausada"
                    fullWidth
                    disabled={hasActionInFlight}
                  >
                    {inFlightAction === 'advance' ? 'Avancando...' : 'Avancar fase'}
                  </Button>
                </Stack>
                <Button
                  onClick={handleCancel}
                  variant="contained"
                  color="error"
                  aria-label="Cancelar sessao Pomodoro"
                  fullWidth
                  disabled={hasActionInFlight}
                >
                  {inFlightAction === 'cancel' ? 'Cancelando...' : 'Cancelar sessão'}
                </Button>
              </Stack>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {pomodoro
              ? pomodoro.isValid
                ? 'Sessão válida em andamento.'
                : `Sessao invalida: ${getPomodoroInvalidationReasonLabel(pomodoro.invalidReason)}`
              : 'Sem sessão ativa no momento.'}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Se a sessão de foco for abandonada (cancelamento, troca de rota, recarregamento, fechamento ou aba oculta por tempo excessivo), ela é invalidada e não conta progresso.
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Avançar fase foi habilitado por design para testes e acessibilidade operacional, incluindo pulo de pausas quando necessário.
          </Typography>

          {latestWalletTransaction && (
            <Typography variant="caption" color="text.secondary">
              Última transação: {latestWalletTransaction.transactionType === 'credit' ? '+' : '-'}
              {latestWalletTransaction.amount} moedas ({latestWalletTransaction.reason}).
            </Typography>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={settingsOpen}
        onClose={handleCloseSettings}
        fullWidth
        maxWidth="sm"
        aria-labelledby="pomodoro-settings-title"
      >
        <DialogTitle id="pomodoro-settings-title">Configuração da sessão Pomodoro</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ajuste os parâmetros da sessão. As alterações aplicam imediatamente para novas sessões.
            </Typography>

            <TextField
              label="Duração do foco (minutos)"
              value={draft.focusDurationMinutes}
              onChange={handleDraftChange('focusDurationMinutes')}
              type="text"
              inputMode="numeric"
              helperText={fieldErrors.focusDurationMinutes ?? 'Valor recomendado entre 5 e 120 minutos.'}
              error={Boolean(fieldErrors.focusDurationMinutes)}
              aria-invalid={Boolean(fieldErrors.focusDurationMinutes)}
              fullWidth
            />

            <TextField
              label="Duração da pausa curta (minutos)"
              value={draft.shortBreakDurationMinutes}
              onChange={handleDraftChange('shortBreakDurationMinutes')}
              type="text"
              inputMode="numeric"
              helperText={fieldErrors.shortBreakDurationMinutes ?? 'Valor recomendado entre 1 e 30 minutos.'}
              error={Boolean(fieldErrors.shortBreakDurationMinutes)}
              aria-invalid={Boolean(fieldErrors.shortBreakDurationMinutes)}
              fullWidth
            />

            <TextField
              label="Duração da pausa longa (minutos)"
              value={draft.longBreakDurationMinutes}
              onChange={handleDraftChange('longBreakDurationMinutes')}
              type="text"
              inputMode="numeric"
              helperText={fieldErrors.longBreakDurationMinutes ?? 'Valor recomendado entre 5 e 60 minutos e maior ou igual a pausa curta.'}
              error={Boolean(fieldErrors.longBreakDurationMinutes)}
              aria-invalid={Boolean(fieldErrors.longBreakDurationMinutes)}
              fullWidth
            />

            <TextField
              label="Ciclos de foco antes da pausa longa"
              value={draft.cyclesBeforeLongBreak}
              onChange={handleDraftChange('cyclesBeforeLongBreak')}
              type="text"
              inputMode="numeric"
              helperText={fieldErrors.cyclesBeforeLongBreak ?? 'Valor recomendado entre 1 e 12 ciclos.'}
              error={Boolean(fieldErrors.cyclesBeforeLongBreak)}
              aria-invalid={Boolean(fieldErrors.cyclesBeforeLongBreak)}
              fullWidth
            />

            {pomodoro && pomodoro.status !== 'finished' && (
              <Alert severity="info">
                Existe uma sessao ativa. A nova configuracao sera usada apenas nas proximas sessoes.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings} disabled={settingsSaving}>Cancelar</Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={settingsSaving || settingsLoading}
            aria-label="Salvar configuracao Pomodoro"
          >
            {settingsSaving ? <CircularProgress size={20} color="inherit" /> : 'Salvar preferências'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PomodoroPage;
