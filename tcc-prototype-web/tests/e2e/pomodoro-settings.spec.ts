import { expect, test } from '@playwright/test';

test.describe('Pomodoro settings flow', () => {
  test('updates focus duration and starts session with new value', async ({ page }) => {
    await page.goto('/pomodoro');

    await page.getByRole('button', { name: /Configurar sessao/i }).click();

    const focusInput = page.getByLabel(/Duracao do foco/i);
    await focusInput.fill('30');

    await page.getByRole('button', { name: /Salvar preferencias/i }).click();

    await expect(page.getByText(/Configuracao salva com sucesso/i)).toBeVisible();

    await page.getByRole('button', { name: /Iniciar sessao/i }).click();

    await expect(page.getByText('30:00')).toBeVisible();
  });

  test('starts focus and transitions to short break when focus completes', async ({ page }) => {
    await page.goto('/pomodoro');

    await page.getByRole('button', { name: /Configurar sessao/i }).click();
    await page.getByLabel(/Duracao do foco/i).fill('1');
    await page.getByLabel(/Duracao da pausa curta/i).fill('1');
    await page.getByLabel(/Duracao da pausa longa/i).fill('2');
    await page.getByLabel(/Ciclos de foco antes da pausa longa/i).fill('4');
    await page.getByRole('button', { name: /Salvar preferencias/i }).click();

    await page.getByRole('button', { name: /Iniciar sessao/i }).click();
    await expect(page.getByText(/Modo atual: focus/i)).toBeVisible();
    await expect(page.getByText(/Sessao concluida com sucesso|Bloco de foco finalizado/i)).toBeVisible({ timeout: 70000 });

    await expect(page.getByText(/Modo atual: short break/i)).toBeVisible({ timeout: 70000 });
  });

  test('invalidates active focus session when leaving pomodoro route', async ({ page }) => {
    await page.goto('/pomodoro');

    await page.getByRole('button', { name: /Iniciar sessao/i }).click();
    await expect(page.getByText(/Modo atual: focus/i)).toBeVisible();

    await page.goto('/dashboard');

    await expect(page.getByText(/progresso nao foi contabilizado|sessao foi invalidada/i)).toBeVisible();
  });
});
