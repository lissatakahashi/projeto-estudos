import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

const { resetPasswordForEmailMock } = vi.hoisted(() => ({
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock('../../lib/supabase/client', () => ({
  default: {
    auth: {
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    resetPasswordForEmailMock.mockReset();
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
  });

  it('exibe orientacoes de entrega de e-mail apos sucesso no envio', async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^E-mail/i), {
      target: { value: 'usuario@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar link/i }));

    expect(await screen.findByText(/Se o e-mail estiver cadastrado/i)).toBeTruthy();
    expect(screen.getByText(/Verifique sua caixa de entrada/i)).toBeTruthy();
    expect(screen.getByText(/caixa de spam ou lixo eletronico/i)).toBeTruthy();
    expect(screen.getByText(/marque o remetente como confiavel/i)).toBeTruthy();
  });

  it('nao exibe orientacoes de entrega de e-mail quando houver erro no envio', async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: { message: 'Falha ao enviar e-mail' },
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^E-mail/i), {
      target: { value: 'usuario@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar link/i }));

    expect(await screen.findByText(/Falha ao enviar e-mail/i)).toBeTruthy();
    expect(screen.queryByText(/Verifique sua caixa de entrada/i)).toBeNull();
  });
});
