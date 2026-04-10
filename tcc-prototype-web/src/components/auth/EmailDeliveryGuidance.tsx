import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import React from 'react';

type EmailDeliveryGuidanceContext = 'register' | 'reset-password';

type EmailDeliveryGuidanceProps = {
  context: EmailDeliveryGuidanceContext;
};

const EMAIL_GUIDANCE_CONTENT: Record<EmailDeliveryGuidanceContext, { title: string; intro: string }> = {
  register: {
    title: 'Confirmação de cadastro enviada',
    intro: 'Enviamos um e-mail para confirmar sua conta.',
  },
  'reset-password': {
    title: 'E-mail de recuperação enviado',
    intro: 'Enviamos um e-mail com o link para redefinir sua senha.',
  },
};

const EmailDeliveryGuidance: React.FC<EmailDeliveryGuidanceProps> = ({ context }) => {
  const content = EMAIL_GUIDANCE_CONTENT[context];

  return (
    <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
      <AlertTitle>{content.title}</AlertTitle>
      <Typography variant="body2" component="p">
        {content.intro}
      </Typography>
      <Box component="ul" sx={{ mb: 0, mt: 1, pl: 2.5 }}>
        <Typography component="li" variant="body2">
          Verifique sua caixa de entrada.
        </Typography>
        <Typography component="li" variant="body2">
          Se não encontrar, confira a caixa de spam ou lixo eletrônico.
        </Typography>
        <Typography component="li" variant="body2">
          Se o e-mail estiver no spam, marque o remetente como confiável para receber as próximas mensagens.
        </Typography>
      </Box>
    </Alert>
  );
};

export default EmailDeliveryGuidance;
