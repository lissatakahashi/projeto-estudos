import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import {
    Alert,
    Slide,
    Snackbar,
    type AlertColor,
    type SlideProps,
} from '@mui/material';
import React from 'react';
import { useMotivationalFeedbackStore } from '../../state/useMotivationalFeedbackStore';

function TransitionUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

function mapVariantToAlertSeverity(variant: string): AlertColor {
  if (variant === 'error') return 'error';
  if (variant === 'warning') return 'warning';
  if (variant === 'info') return 'info';
  return 'success';
}

const GlobalMotivationalFeedback: React.FC = () => {
  const active = useMotivationalFeedbackStore((s) => s.active);
  const dismissActive = useMotivationalFeedbackStore((s) => s.dismissActive);

  return (
    <Snackbar
      key={active?.id}
      open={Boolean(active)}
      onClose={(_event, reason) => {
        if (reason === 'clickaway') return;
        dismissActive();
      }}
      autoHideDuration={active?.durationMs ?? 4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={TransitionUp}
    >
      <Alert
        onClose={() => {
          dismissActive();
        }}
        severity={mapVariantToAlertSeverity(active?.variant ?? 'info')}
        variant="filled"
        icon={active?.variant === 'motivational' ? <AutoAwesomeRounded fontSize="inherit" /> : undefined}
        sx={{
          width: '100%',
          minWidth: { xs: 'min(92vw, 420px)', sm: 420 },
          borderRadius: 2,
          boxShadow: 4,
          ...(active?.variant === 'motivational'
            ? {
              backgroundImage: 'linear-gradient(110deg, #0f766e 0%, #166534 100%)',
            }
            : {}),
        }}
      >
        {active?.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalMotivationalFeedback;
