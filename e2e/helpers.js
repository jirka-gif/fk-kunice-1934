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

// Najde termín, který server považuje za volný. Pevně zvolený čas by test
// rozbil, jakmile by na něj padla jiná rezervace nebo zavřený den.
export async function volnyTermin(page, area) {
  const dnes = new Date();
  for (let i = 3; i < 40; i++) {
    const d = new Date(dnes.getTime() + i * 86400000);
    const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const res = await page.request.get(`/api/availability?area=${encodeURIComponent(area)}&date=${dateISO}`);
    if (!res.ok()) continue;
    const json = await res.json();
    const volny = (json.slots || []).find((s) => s.free);
    if (volny) return { dateISO, from: volny.time };
  }
  throw new Error('Nenašel se volný termín pro test.');
}

// Pošle poptávku pronájmu jako návštěvník webu a vrátí jméno, pod kterým je v adminu.
export async function poptavkaZWebu(page, { area = 'Hlavní stadion', email = 'zadatel@example.cz' } = {}) {
  const { dateISO, from } = await volnyTermin(page, area);
  const jmeno = `Žadatel ${Date.now()}`;
  const res = await page.request.post('/api/submit', {
    data: { type: 'reservation', payload: { name: jmeno, email, area, dateISO, from, note: 'e2e' } },
  });
  if (!res.ok()) throw new Error(`Poptávku se nepodařilo odeslat: ${res.status()}`);
  return { jmeno, email, dateISO, from };
}
