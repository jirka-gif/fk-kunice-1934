// Sdílené pomocné funkce pro e2e testy.
export const ADMIN_PASSWORD = 'test-heslo';

// Přihlásí se do administrace a počká, až se načte přehled.
export async function loginToAdmin(page) {
  await page.goto('/admin/login');
  await page.getByPlaceholder('Heslo').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Přihlásit se' }).click();
  await page.waitForURL('**/admin');
  await page.getByText('Přehled', { exact: true }).first().waitFor();
}

// Otevře sekci v levém menu administrace.
export async function openAdminSection(page, id) {
  await page.locator(`[data-sec="${id}"]`).click();
}
