import { expect, test } from '@playwright/test';

const e2eIdentifier = process.env.E2E_TEST_IDENTIFIER;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe('Pet Care E2E', () => {
  test.skip(!e2eIdentifier || !e2ePassword, 'Requires E2E_TEST_IDENTIFIER and E2E_TEST_PASSWORD.');

  test('loads pet area and feeds pet with UI feedback', async ({ page }) => {
    await page.goto('/login');

    const cookieAcceptButton = page.getByRole('button', { name: /Aceitar/i });
    if (await cookieAcceptButton.isVisible().catch(() => false)) {
      await cookieAcceptButton.click();
    }

    await page.getByLabel(/E-mail ou celular/i).fill(String(e2eIdentifier));
    await page.getByLabel(/^Senha$/i).fill(String(e2ePassword));
    await page.getByRole('button', { name: /^Entrar$/i }).click();

    await expect(page).toHaveURL(/\/(pomodoro|shop|inventory|environment|pet)/);

    await page.goto('/pet');
    await expect(page.getByRole('heading', { name: /Personagem Virtual/i })).toBeVisible();

    const feedButton = page.getByRole('button', { name: /Alimentar pet/i });
    await expect(feedButton).toBeVisible();
    await feedButton.click();

    await expect(page.getByText(/Pet alimentado com sucesso|Aguarde .* para alimentar novamente|Saldo insuficiente/i)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /Personagem Virtual/i })).toBeVisible();
  });
});
