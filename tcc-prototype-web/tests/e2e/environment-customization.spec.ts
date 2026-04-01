import { expect, test } from '@playwright/test';

const e2eIdentifier = process.env.E2E_TEST_IDENTIFIER;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe('Environment Customization E2E', () => {
  test.skip(!e2eIdentifier || !e2ePassword, 'Requires E2E_TEST_IDENTIFIER and E2E_TEST_PASSWORD.');

  test('equip item in environment slot and persist after reload', async ({ page }) => {
    await page.goto('/login');

    const cookieAcceptButton = page.getByRole('button', { name: /Aceitar/i });
    if (await cookieAcceptButton.isVisible().catch(() => false)) {
      await cookieAcceptButton.click();
    }

    await page.getByLabel(/E-mail ou celular/i).fill(String(e2eIdentifier));
    await page.getByLabel(/^Senha$/i).fill(String(e2ePassword));
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/(pomodoro|shop|inventory|environment)/);

    await page.goto('/shop');

    const buyButton = page.getByRole('button', { name: /^Comprar item$/i }).first();
    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(400);
    }

    await page.goto('/environment');

    await expect(page.getByRole('heading', { name: /Ambiente Virtual/i })).toBeVisible();

    await page.getByRole('button', { name: /Selecionar slot Plano de fundo/i }).click();

    const equipButton = page.getByRole('button', { name: /Equipar neste slot/i }).first();
    const canEquip = await equipButton.isVisible().catch(() => false);
    test.skip(!canEquip, 'No compatible inventory item available for selected slot.');

    await equipButton.click();

    await expect(page.getByText(/equipado|Ambiente atualizado/i)).toBeVisible();

    await page.reload();

    await page.getByRole('button', { name: /Selecionar slot Plano de fundo/i }).click();
    await expect(page.getByRole('button', { name: /Ja equipado neste slot/i })).toBeVisible();
  });
});
