// E2E: detail novinky a stránkování v přehledu.
import { test, expect } from '@playwright/test';
import { loginToAdmin, openAdminSection } from './helpers.js';

test('z přehledu novinek se dá prokliknout na detail článku', async ({ page }) => {
  await page.goto('/novinky');
  const title = await page.getByRole('heading', { level: 1 }).textContent();
  expect(title).toBeTruthy();

  // hlavní (nejnovější) novinka vede na svůj detail
  await page.locator('a[href^="/novinky/"]').first().click();
  await expect(page).toHaveURL(/\/novinky\/[^/]+$/);
  await expect(page.getByRole('link', { name: 'Zpět na novinky' })).toBeVisible();
  await expect(page.getByText('DALŠÍ NOVINKY')).toBeVisible();
});

test('detail neexistující novinky ukáže hlášku místo pádu', async ({ page }) => {
  await page.goto('/novinky/tenhle-clanek-neexistuje');
  await expect(page.getByText('Novinka nenalezena')).toBeVisible();
});

test('stránkování se objeví, když je novinek víc než jedna stránka', async ({ page }) => {
  // ve výchozím obsahu je 6 novinek → 1 hlavní + 5 ve výpisu = jedna stránka
  await page.goto('/novinky');
  await expect(page.getByRole('navigation', { name: 'Stránkování novinek' })).toHaveCount(0);

  // přidáme novinky v adminu tak, aby vznikla druhá stránka
  await loginToAdmin(page);
  await openAdminSection(page, 'novinky');
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '+ Přidat novinku' }).click();
    // nová novinka vzniká jako koncept — na web ji pustí až přepínač
    await page.getByRole('switch', { name: 'Zveřejnit novinku na webu' }).click();
  }
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await page.goto('/novinky');
  const pager = page.getByRole('navigation', { name: 'Stránkování novinek' });
  await expect(pager).toBeVisible();
  await pager.getByRole('button', { name: '2' }).click();
  await expect(pager.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
});

test('nová novinka z adminu má funkční detail', async ({ page }) => {
  const title = `Test článek ${Date.now()}`;

  await loginToAdmin(page);
  await openAdminSection(page, 'novinky');
  await page.getByRole('button', { name: '+ Přidat novinku' }).click();
  // nová položka se přidá na konec seznamu
  await page.getByLabel('Titulek').last().fill(title);
  await page.getByLabel('Perex (pár vět do výpisu)').last().fill('Perex testovacího článku.');
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  // adresa článku se vytvoří z titulku sama — ručně ji nikdo zadávat nemusí
  const content = await (await page.request.get('/api/content')).json();
  const clanek = content.news.find((n) => n.title === title);
  expect(clanek).toBeTruthy();
  expect(clanek.id).toBeTruthy();

  await page.goto(`/novinky/${clanek.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.getByText('Perex testovacího článku.')).toBeVisible();
});

test('adresu článku jde přepsat v Pokročilém nastavení', async ({ page }) => {
  await loginToAdmin(page);
  await openAdminSection(page, 'novinky');
  await page.getByRole('button', { name: '+ Přidat novinku' }).click();
  await page.getByLabel('Titulek').last().fill(`Vlastní adresa ${Date.now()}`);

  // pole je schované, dokud si ho člověk vědomě nerozbalí
  await expect(page.getByLabel('Adresa článku (/novinky/…)')).toHaveCount(0);
  await page.getByRole('button', { name: /Pokročilé nastavení/ }).last().click();
  await page.getByLabel('Adresa článku (/novinky/…)').last().fill('moje-vlastni-adresa');
  await page.waitForResponse((r) => r.url().includes('/api/content') && r.request().method() === 'PUT' && r.ok());

  await page.goto('/novinky/moje-vlastni-adresa');
  await expect(page.getByText('Novinka nenalezena')).toHaveCount(0);
});
