import { expect, test } from '@playwright/test';

test.describe('Pomodoro settings flow', () => {
  test('updates focus duration and starts session with new value', async ({ page }) => {
    await page.goto('http://localhost:5174/pomodoro');

    await page.getByRole('button', { name: /Configurar sessao/i }).click();

    const focusInput = page.getByLabel(/Duracao do foco/i);
    await focusInput.fill('30');

    await page.getByRole('button', { name: /Salvar preferencias/i }).click();

    await expect(page.getByText(/Configuracao salva com sucesso/i)).toBeVisible();

    await page.getByRole('button', { name: /Iniciar sessao/i }).click();

    await expect(page.getByText('30:00')).toBeVisible();
  });
});
