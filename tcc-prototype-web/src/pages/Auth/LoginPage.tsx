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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    LOGIN_FORM_INITIAL_VALUES,
    type LoginFieldName,
    type LoginFormErrors,
    type LoginFormValues,
} from '../../domain/auth/types/login';
import { validateLoginForm } from '../../domain/auth/validation/loginValidation';
import { loginWithIdentifier } from '../../lib/supabase/loginService';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState<LoginFormValues>(LOGIN_FORM_INITIAL_VALUES);
    const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFieldChange = (field: LoginFieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        setFormValues((prev) => ({ ...prev, [field]: nextValue }));

        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) {
            return;
        }

        const { errors, sanitized } = validateLoginForm(formValues);
        setFieldErrors(errors);

        if (!sanitized) {
            return;
        }

        setLoading(true);
        setError(null);

        const result = await loginWithIdentifier(sanitized);

        if (!result.success) {
            if (result.field === 'identifier' || result.field === 'password') {
                setFieldErrors((prev) => ({ ...prev, [result.field]: result.message }));
            }

            setError(result.message);
            setLoading(false);
            return;
        }

        navigate('/pomodoro');
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                    Entrar
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Acesse sua conta para sincronizar seu progresso
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleLogin} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="identifier"
                        label="E-mail ou celular"
                        name="identifier"
                        autoComplete="username"
                        autoFocus
                        placeholder="voce@exemplo.com ou (11) 99999-9999"
                        value={formValues.identifier}
                        onChange={handleFieldChange('identifier')}
                        error={Boolean(fieldErrors.identifier)}
                        helperText={fieldErrors.identifier ?? 'Use seu e-mail ou celular com DDD.'}
                        aria-invalid={Boolean(fieldErrors.identifier)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Senha"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={formValues.password}
                        onChange={handleFieldChange('password')}
                        error={Boolean(fieldErrors.password)}
                        helperText={fieldErrors.password}
                        aria-invalid={Boolean(fieldErrors.password)}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, borderRadius: '999px', py: 1.5 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                    </Button>
                    <Box sx={{ textAlign: 'right', mb: 2 }}>
                        <Link component={RouterLink} to="/forgot-password" variant="body2">
                            Esqueci minha senha
                        </Link>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/register" variant="body2">
                            {"Não tem uma conta? Registre-se"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
