import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Container,
    FormControlLabel,
    FormHelperText,
    Link,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PrivacyPolicyReadBox from '../../components/auth/PrivacyPolicyReadBox';
import {
    REGISTER_FORM_INITIAL_VALUES,
    type RegisterFieldName,
    type RegisterFormErrors,
    type RegisterFormValues,
} from '../../domain/auth/types/register';
import {
    normalizeBrazilianPhone,
    validateRegisterForm,
} from '../../domain/auth/validation/registerValidation';
import { registerWithEmail } from '../../lib/supabase/registerService';

const LGPD_READ_REQUIRED_MESSAGE = 'Role ate o final da politica de privacidade para habilitar o aceite LGPD.';

const RegisterPage: React.FC = () => {
    const [formValues, setFormValues] = useState<RegisterFormValues>(REGISTER_FORM_INITIAL_VALUES);
    const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(true);
    const [hasReadPrivacyPolicy, setHasReadPrivacyPolicy] = useState(false);

    const isSubmitDisabled = useMemo(() => loading || success, [loading, success]);
    const isLgpdCheckboxDisabled = useMemo(
        () => isSubmitDisabled || !hasReadPrivacyPolicy,
        [hasReadPrivacyPolicy, isSubmitDisabled]
    );

    const handleTextChange = (field: Exclude<RegisterFieldName, 'acceptLgpd'>) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const nextValue = event.target.value;
        setFormValues((prev) => ({ ...prev, [field]: nextValue }));

        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handlePhoneBlur = () => {
        const normalized = normalizeBrazilianPhone(formValues.phone);
        if (normalized) {
            setFormValues((prev) => ({ ...prev, phone: normalized }));
        }
    };

    const handleLgpdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!hasReadPrivacyPolicy) {
            setFieldErrors((prev) => ({
                ...prev,
                acceptLgpd: LGPD_READ_REQUIRED_MESSAGE,
            }));
            return;
        }

        const checked = event.target.checked;
        setFormValues((prev) => ({ ...prev, acceptLgpd: checked }));

        if (fieldErrors.acceptLgpd) {
            setFieldErrors((prev) => ({ ...prev, acceptLgpd: undefined }));
        }
    };

    const handlePolicyCompletionChange = (isCompleted: boolean) => {
        setHasReadPrivacyPolicy(isCompleted);

        if (!isCompleted && formValues.acceptLgpd) {
            setFormValues((prev) => ({ ...prev, acceptLgpd: false }));
        }

        if (isCompleted && fieldErrors.acceptLgpd === LGPD_READ_REQUIRED_MESSAGE) {
            setFieldErrors((prev) => ({ ...prev, acceptLgpd: undefined }));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) {
            return;
        }

        if (!hasReadPrivacyPolicy) {
            setFieldErrors((prev) => ({
                ...prev,
                acceptLgpd: LGPD_READ_REQUIRED_MESSAGE,
            }));
            return;
        }

        const { errors, sanitized } = validateRegisterForm(formValues);
        setFieldErrors(errors);

        if (!sanitized) {
            return;
        }

        setLoading(true);
        setError(null);

        const result = await registerWithEmail(sanitized);

        if (!result.success) {
            setError(result.message ?? 'Nao foi possivel concluir o cadastro.');
            setLoading(false);
            return;
        }

        setRequiresEmailConfirmation(Boolean(result.requiresEmailConfirmation));
        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                        Cadastro realizado!
                    </Typography>
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {requiresEmailConfirmation
                            ? 'Verifique seu e-mail para confirmar seu cadastro.'
                            : 'Sua conta foi criada com sucesso.'}
                    </Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        component={RouterLink}
                        to="/login"
                        sx={{ borderRadius: '999px' }}
                    >
                        Ir para Login
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                    Criar Conta
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Preencha os dados para criar sua conta e sincronizar seu progresso
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleRegister} noValidate>
                    <Stack spacing={1.5}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="fullName"
                            label="Nome completo"
                            name="fullName"
                            autoComplete="name"
                            autoFocus
                            placeholder="Ex.: Maria da Silva"
                            value={formValues.fullName}
                            onChange={handleTextChange('fullName')}
                            error={Boolean(fieldErrors.fullName)}
                            helperText={fieldErrors.fullName}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.fullName)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="birthDate"
                            label="Data de nascimento"
                            name="birthDate"
                            type="date"
                            value={formValues.birthDate}
                            onChange={handleTextChange('birthDate')}
                            error={Boolean(fieldErrors.birthDate)}
                            helperText={fieldErrors.birthDate}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.birthDate)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="E-mail"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="voce@exemplo.com"
                            value={formValues.email}
                            onChange={handleTextChange('email')}
                            error={Boolean(fieldErrors.email)}
                            helperText={fieldErrors.email}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.email)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="phone"
                            label="Celular"
                            name="phone"
                            autoComplete="tel"
                            placeholder="(11) 99999-9999"
                            value={formValues.phone}
                            onChange={handleTextChange('phone')}
                            onBlur={handlePhoneBlur}
                            error={Boolean(fieldErrors.phone)}
                            helperText={fieldErrors.phone ?? 'Aceita 10 ou 11 digitos com DDD. Ex.: +5511999999999'}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.phone)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Senha"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            placeholder="Minimo de 8 caracteres, com letra e numero"
                            value={formValues.password}
                            onChange={handleTextChange('password')}
                            error={Boolean(fieldErrors.password)}
                            helperText={fieldErrors.password}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.password)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmar senha"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formValues.confirmPassword}
                            onChange={handleTextChange('confirmPassword')}
                            error={Boolean(fieldErrors.confirmPassword)}
                            helperText={fieldErrors.confirmPassword}
                            disabled={isSubmitDisabled}
                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        />

                        <Box>
                            <PrivacyPolicyReadBox onCompletionChange={handlePolicyCompletionChange} />
                        </Box>

                        <Box>
                            <FormControlLabel
                                control={(
                                    <Checkbox
                                        id="acceptLgpd"
                                        name="acceptLgpd"
                                        checked={formValues.acceptLgpd}
                                        onChange={handleLgpdChange}
                                        disabled={isLgpdCheckboxDisabled}
                                        inputProps={{
                                            'aria-invalid': Boolean(fieldErrors.acceptLgpd),
                                        }}
                                    />
                                )}
                                label={(
                                    <Typography variant="body2" component="span">
                                        Li e aceito a{' '}
                                        <Link
                                            href="/politica-privacidade.html"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            underline="hover"
                                        >
                                            política de privacidade
                                        </Link>{' '}
                                        e o tratamento de dados conforme LGPD.
                                    </Typography>
                                )}
                            />
                            {!hasReadPrivacyPolicy && !fieldErrors.acceptLgpd && (
                                <FormHelperText>
                                    Role ate o final da politica para liberar este campo.
                                </FormHelperText>
                            )}
                            {fieldErrors.acceptLgpd && (
                                <FormHelperText error>
                                    {fieldErrors.acceptLgpd}
                                </FormHelperText>
                            )}
                        </Box>
                    </Stack>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isSubmitDisabled}
                        sx={{ mt: 3, mb: 2, borderRadius: '999px', py: 1.5 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrar'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            {"Já tem uma conta? Entre"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegisterPage;
