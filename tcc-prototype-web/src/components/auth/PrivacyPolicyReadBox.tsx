import { Alert, Box, LinearProgress, Link, Stack, Typography } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

const DEFAULT_COMPLETION_THRESHOLD = 0.97;

type PrivacyPolicyReadBoxProps = {
  onCompletionChange: (isCompleted: boolean) => void;
  completionThreshold?: number;
};

const PrivacyPolicyReadBox: React.FC<PrivacyPolicyReadBoxProps> = ({
  onCompletionChange,
  completionThreshold = DEFAULT_COMPLETION_THRESHOLD,
}) => {
  const [progressPercent, setProgressPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const readingHint = useMemo(
    () => (isCompleted
      ? 'Leitura mínima concluída. Agora você pode marcar o aceite LGPD.'
      : 'Role até o final da política para habilitar o aceite LGPD.'),
    [isCompleted],
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    if (scrollHeight <= clientHeight) {
      setProgressPercent(100);
      if (!isCompleted) {
        setIsCompleted(true);
        onCompletionChange(true);
      }
      return;
    }

    const rawProgress = (scrollTop + clientHeight) / scrollHeight;
    const cappedProgress = Math.min(1, Math.max(0, rawProgress));
    const nextPercent = Math.round(cappedProgress * 100);
    const reachedThreshold = cappedProgress >= completionThreshold;

    setProgressPercent(nextPercent);

    if (reachedThreshold !== isCompleted) {
      setIsCompleted(reachedThreshold);
      onCompletionChange(reachedThreshold);
    }
  }, [completionThreshold, isCompleted, onCompletionChange]);

  return (
    <Stack spacing={1.2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Leitura obrigatória da política de privacidade
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Para concluir o cadastro com consentimento explícito (LGPD), percorra o texto abaixo e depois marque o aceite.
      </Typography>

      <Box
        role="region"
        aria-label="Texto da politica de privacidade"
        onScroll={handleScroll}
        sx={{
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid',
          borderColor: isCompleted ? 'success.main' : 'divider',
          borderRadius: 1.5,
          p: 1.5,
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body2" paragraph>
          Esta política descreve como o Projeto de Estudos coleta, utiliza e protege seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          1. Dados coletados
        </Typography>
        <Typography variant="body2" paragraph>
          Nome completo, data de nascimento, e-mail e celular informados no cadastro.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          2. Finalidade do uso
        </Typography>
        <Typography variant="body2" paragraph>
          Criar e gerenciar sua conta, autenticar acesso, personalizar sua experiência de estudo e viabilizar comunicações essenciais da plataforma.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          3. Armazenamento e segurança
        </Typography>
        <Typography variant="body2" paragraph>
          Os dados são armazenados em infraestrutura digital com medidas técnicas e administrativas para reduzir riscos de acesso indevido, perda ou alteração.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          4. Direitos do titular
        </Typography>
        <Typography variant="body2" paragraph>
          Você pode solicitar confirmação de tratamento, acesso, correção, bloqueio, eliminação e revogação do consentimento, quando aplicável.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          5. Contato
        </Typography>
        <Typography variant="body2" paragraph sx={{ mb: 0 }}>
          Para dúvidas e solicitações sobre privacidade, consulte o documento completo em{' '}
          <Link href="/politica-privacidade.html" target="_blank" rel="noopener noreferrer" underline="hover">
            política de privacidade
          </Link>
          .
        </Typography>
      </Box>

      <Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          aria-label="Progresso de leitura da politica de privacidade"
          sx={{ height: 8, borderRadius: 999 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Progresso de leitura: {progressPercent}%
        </Typography>
      </Box>

      <Alert severity={isCompleted ? 'success' : 'info'} sx={{ py: 0.5 }}>
        {readingHint}
      </Alert>
    </Stack>
  );
};

export default PrivacyPolicyReadBox;
