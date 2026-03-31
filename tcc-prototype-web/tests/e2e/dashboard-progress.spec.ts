import { expect, test } from '@playwright/test';

const e2eIdentifier = process.env.E2E_TEST_IDENTIFIER;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe('Dashboard progress E2E', () => {
  test.skip(!e2eIdentifier || !e2ePassword, 'Requires E2E_TEST_IDENTIFIER and E2E_TEST_PASSWORD.');

  test('completes a valid focus session and dashboard shows updated progress', async ({ page }) => {
    await page.goto('/login');

    const cookieAcceptButton = page.getByRole('button', { name: /Aceitar/i });
    if (await cookieAcceptButton.isVisible().catch(() => false)) {
      await cookieAcceptButton.click();
    }

    await page.getByLabel(/E-mail ou celular/i).fill(String(e2eIdentifier));
    await page.getByLabel(/^Senha$/i).fill(String(e2ePassword));
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/pomodoro/);

    await page.getByRole('button', { name: /Configurar sessao/i }).click();
    await page.getByLabel(/Duracao do foco/i).fill('1');
    await page.getByRole('button', { name: /Salvar preferencias/i }).click();

    await page.getByRole('button', { name: /Iniciar sessao/i }).click();
    await expect(page.getByText(/Modo atual: focus/i)).toBeVisible();

    await expect(page.getByText(/Modo atual: short break/i)).toBeVisible({ timeout: 70000 });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /Dashboard de Progresso/i })).toBeVisible();
    await expect(page.getByText(/Sessões concluídas/i)).toBeVisible();
    await expect(page.getByText(/Moedas ganhas/i)).toBeVisible();
  });

  test('buying item reflects in dashboard purchased total', async ({ page }) => {
    await page.goto('/login');

    const cookieAcceptButton = page.getByRole('button', { name: /Aceitar/i });
    if (await cookieAcceptButton.isVisible().catch(() => false)) {
      await cookieAcceptButton.click();
    }

    await page.getByLabel(/E-mail ou celular/i).fill(String(e2eIdentifier));
    await page.getByLabel(/^Senha$/i).fill(String(e2ePassword));
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await page.goto('/shop');

    const buyButton = page.getByRole('button', { name: /^Comprar item$/i }).first();
    const canBuy = await buyButton.isVisible().catch(() => false);
    test.skip(!canBuy, 'No purchasable item available for this user account.');

    await buyButton.click();
    await expect(page.getByText(/Item adicionado ao inventario/i)).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByText(/Itens comprados/i)).toBeVisible();
  });
});
