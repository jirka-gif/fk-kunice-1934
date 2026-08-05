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

// Otevře sekci v levém menu administrace.
export async function openAdminSection(page, id) {
  await page.locator(`[data-sec="${id}"]`).click();
}
