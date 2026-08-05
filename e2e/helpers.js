// Sdílené pomocné funkce pro e2e testy.
export const ADMIN_EMAIL = 'spravce@fkkunice.cz';
export const ADMIN_PASSWORD = 'test-heslo';

// Přihlásí se do administrace a počká, až se načte přehled.
export async function loginToAdmin(page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/admin/login');
  await page.getByPlaceholder('E-mail').fill(email);
  await page.getByPlaceholder('Heslo').fill(password);
  await page.getByRole('button', { name: 'Přihlásit se' }).click();
  await page.waitForURL('**/admin');
  await page.getByText('Přehled', { exact: true }).first().waitFor();
}

// Otevře sekci administrace. Menu je seskupené — když sekce zrovna není vidět,
// nejdřív klikneme na skupinu, která ji obsahuje.
export async function openAdminSection(page, id) {
  const sekce = page.locator(`[data-sec="${id}"]`);
  if ((await sekce.count()) === 0) {
    await page.locator(`[data-group-has~="${id}"]`).first().click();
  }
  const znovu = page.locator(`[data-sec="${id}"]`);
  // skupina s jedinou sekcí záložky nemá — po kliknutí na skupinu už jsme tam
  if ((await znovu.count()) > 0) await znovu.first().click();
}
