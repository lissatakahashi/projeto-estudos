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
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase/client';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

            const hasRecoveryTokenInUrl =
                urlParams.get('type') === 'recovery' ||
                hashParams.get('type') === 'recovery' ||
                Boolean(hashParams.get('access_token'));

            const { data } = await supabase.auth.getSession();
            setHasRecoverySession(Boolean(data.session) || hasRecoveryTokenInUrl);
            setCheckingSession(false);
        };

        checkSession();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setHasRecoverySession(true);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
        setTimeout(() => navigate('/login'), 1500);
    };

    if (checkingSession) {
        return (
            <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <CircularProgress />
                </Paper>
            </Container>
        );
    }

    if (!hasRecoverySession) {
        return (
            <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                        Link inválido ou expirado
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Solicite um novo link para redefinir sua senha.
                    </Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        component={RouterLink}
                        to="/forgot-password"
                        sx={{ borderRadius: '999px' }}
                    >
                        Solicitar novo link
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                    Redefinir senha
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Defina sua nova senha para continuar
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Senha atualizada com sucesso. Redirecionando para login...
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Nova senha"
                        type="password"
                        id="password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || success}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirmar nova senha"
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Atualizar senha'}
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

export default ResetPasswordPage;
