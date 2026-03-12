import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Link,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import supabase from '../../lib/supabase/client';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const getRedirectTo = () => {
        const configuredBaseUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();

        if (configuredBaseUrl) {
            try {
                return new URL('/reset-password', configuredBaseUrl).toString();
            } catch {
                return `${window.location.origin}/reset-password`;
            }
        }

        return `${window.location.origin}/reset-password`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectTo(),
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                    Recuperar senha
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Informe seu e-mail para receber o link de redefinição
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-mail"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || success}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || success}
                        sx={{ mt: 3, mb: 2, borderRadius: '999px', py: 1.5 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar link'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            Voltar para login
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;
