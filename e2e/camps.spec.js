// E2E: správa více kempů (přidání, archivace) a její projev na webu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('web ukazuje přepínač kempů a detail vybraného kempu', async ({ page }) => {
  await page.goto('/kempy');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('PROČ NÁŠ KEMP')).toBeVisible();
  await expect(page.getByText('DENNÍ PROGRAM')).toBeVisible();
});

test('nový kemp přidaný v adminu se objeví na webu a po archivaci zmizí', async ({ page }) => {
  const title = `Podzimní kemp ${Date.now()}`;

  await loginToAdmin(page);
  await openAdminSection(page, 'kempy');
  await page.getByRole('button', { name: '+ Přidat kemp' }).click();
  await page.getByLabel('Titulek').fill(title);
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // na webu je nový kemp v přepínači
  await page.goto('/kempy');
  await expect(page.getByText(title)).toBeVisible();

  // archivace ho z webu odstraní
  await page.goto('/admin');
  await openAdminSection(page, 'kempy');
  await page.getByRole('button', { name: title }).click();
  await page.getByRole('button', { name: 'Archivovat' }).click();
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await page.goto('/kempy');
  await expect(page.getByText(title)).toHaveCount(0);
});
