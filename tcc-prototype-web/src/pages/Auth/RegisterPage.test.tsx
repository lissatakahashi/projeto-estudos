import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBirthDateLimits } from '../../domain/auth/validation/birthDatePolicy';
import RegisterPage from './RegisterPage';

const { registerWithEmailMock } = vi.hoisted(() => ({
  registerWithEmailMock: vi.fn(),
}));

vi.mock('../../lib/supabase/registerService', () => ({
  registerWithEmail: registerWithEmailMock,
}));

function fillRequiredFields(): void {
  fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: 'Maria da Silva' } });
  fireEvent.change(screen.getByLabelText(/Data de nascimento/i), { target: { value: '1998-01-20' } });
  fireEvent.change(screen.getByLabelText(/^E-mail/i), { target: { value: 'maria.silva@example.com' } });
  fireEvent.change(screen.getByLabelText(/Celular/i), { target: { value: '(11) 99999-9999' } });
  fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'Senha123' } });
  fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: 'Senha123' } });
}

function completePrivacyPolicyRead(): void {
  const policyRegion = screen.getByRole('region', { name: /Texto da politica de privacidade/i });

  Object.defineProperty(policyRegion, 'scrollHeight', {
    configurable: true,
    value: 1000,
  });

  Object.defineProperty(policyRegion, 'clientHeight', {
    configurable: true,
    value: 300,
  });

  fireEvent.scroll(policyRegion, { target: { scrollTop: 700 } });
}

describe('RegisterPage - consentimento LGPD', () => {
  beforeEach(() => {
    registerWithEmailMock.mockReset();
    registerWithEmailMock.mockResolvedValue({
      success: true,
      requiresEmailConfirmation: true,
    });
  });

  it('mantem checkbox LGPD bloqueado antes da leitura da politica', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const checkbox = screen.getByRole('checkbox', { name: /Li e aceito a politica de privacidade/i });
    expect(checkbox.getAttribute('disabled')).not.toBeNull();
    expect(screen.getByText(/Role ate o final da politica para liberar este campo/i)).toBeTruthy();
  });

  it('define limite maximo coerente para data de nascimento no input', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const birthDateInput = screen.getByLabelText(/Data de nascimento/i);
    const { latestBirthDate } = getBirthDateLimits();

    expect(birthDateInput.getAttribute('max')).toBe(latestBirthDate);
  });

  it('habilita checkbox LGPD ao chegar ao final da politica', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    completePrivacyPolicyRead();

    const checkbox = screen.getByRole('checkbox', { name: /Li e aceito a politica de privacidade/i });
    expect(checkbox.getAttribute('disabled')).toBeNull();
    expect(screen.getByText(/Leitura minima concluida/i)).toBeTruthy();
  });

  it('bloqueia submit sem aceite valido apos leitura da politica', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    completePrivacyPolicyRead();

    fireEvent.click(screen.getByRole('button', { name: /Registrar/i }));

    expect(screen.getByText(/Voce precisa aceitar a politica de privacidade para continuar/i)).toBeTruthy();
    expect(registerWithEmailMock).not.toHaveBeenCalled();
  });

  it('bloqueia submit quando data de nascimento e futura', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Data de nascimento/i), { target: { value: '2999-01-01' } });
    completePrivacyPolicyRead();
    fireEvent.click(screen.getByRole('checkbox', { name: /Li e aceito a politica de privacidade/i }));

    fireEvent.click(screen.getByRole('button', { name: /Registrar/i }));

    expect(screen.getByText(/A data de nascimento nao pode ser futura/i)).toBeTruthy();
    expect(registerWithEmailMock).not.toHaveBeenCalled();
  });

  it('exibe orientacoes de entrega de e-mail apos cadastro com confirmacao por e-mail', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    completePrivacyPolicyRead();
    fireEvent.click(screen.getByRole('checkbox', { name: /Li e aceito a politica de privacidade/i }));
    fireEvent.click(screen.getByRole('button', { name: /Registrar/i }));

    expect(await screen.findByText(/Cadastro realizado!/i)).toBeTruthy();
    expect(screen.getByText(/Verifique sua caixa de entrada/i)).toBeTruthy();
    expect(screen.getByText(/caixa de spam ou lixo eletronico/i)).toBeTruthy();
    expect(screen.getByText(/marque o remetente como confiavel/i)).toBeTruthy();
  });

  it('nao exibe orientacoes de entrega de e-mail quando o cadastro falha', async () => {
    registerWithEmailMock.mockResolvedValueOnce({
      success: false,
      message: 'Erro no envio',
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fillRequiredFields();
    completePrivacyPolicyRead();
    fireEvent.click(screen.getByRole('checkbox', { name: /Li e aceito a politica de privacidade/i }));
    fireEvent.click(screen.getByRole('button', { name: /Registrar/i }));

    expect(await screen.findByText(/Erro no envio/i)).toBeTruthy();
    expect(screen.queryByText(/Verifique sua caixa de entrada/i)).toBeNull();
  });
});
