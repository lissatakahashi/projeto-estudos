import { expect, test } from '@playwright/test';

const e2eIdentifier = process.env.E2E_TEST_IDENTIFIER;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe('Shop to Inventory E2E', () => {
  test.skip(!e2eIdentifier || !e2ePassword, 'Requires E2E_TEST_IDENTIFIER and E2E_TEST_PASSWORD.');

  test('buying an item updates inventory', async ({ page }) => {
    await page.goto('/login');

    const cookieAcceptButton = page.getByRole('button', { name: /Aceitar/i });
    if (await cookieAcceptButton.isVisible().catch(() => false)) {
      await cookieAcceptButton.click();
    }

    await page.getByLabel(/E-mail ou celular/i).fill(String(e2eIdentifier));
    await page.getByLabel(/^Senha$/i).fill(String(e2ePassword));
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/pomodoro/);

    await page.goto('/shop');

    const buyButton = page.getByRole('button', { name: /^Comprar item$/i }).first();
    const canBuy = await buyButton.isVisible().catch(() => false);
    test.skip(!canBuy, 'No purchasable item available for this user account.');

    await buyButton.click();

    await expect(page.getByText(/Item adicionado ao inventario/i)).toBeVisible();

    await page.goto('/inventory');

    await expect(page.getByRole('heading', { name: /Inventário/i })).toBeVisible();
    await expect(page.getByText(/Voce ainda nao possui itens/i)).not.toBeVisible();
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();
  });
});
