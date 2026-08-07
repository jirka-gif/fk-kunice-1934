// Texty e-mailů žadateli — čistá logika, nic se neodesílá.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reservationDecisionMail, registrationDecisionMail, historyEntry, missingMailConfig, sendMail, mailStatus } from '@/lib/mail';

const rez = { name: 'Jan Novák', area: 'Hlavní stadion', date: '12. července 2026', from: '17:00', to: '18:00' };

describe('potvrzení a zamítnutí rezervace', () => {
  it('potvrzení obsahuje plochu i termín', () => {
    const m = reservationDecisionMail(rez, true, 'info@fkkunice.cz');
    expect(m.subject).toContain('potvrzena');
    expect(m.text).toContain('Hlavní stadion');
    expect(m.text).toContain('17:00–18:00');
    expect(m.text).toContain('Jan Novák');
  });

  it('zamítnutí nabídne jiný termín, ať člověk neskončí ve slepé uličce', () => {
    const m = reservationDecisionMail(rez, false, 'info@fkkunice.cz');
    expect(m.subject).toContain('nepotvrzena');
    expect(m.text).toContain('jiný termín');
  });

  it('poradí si s prázdnou rezervací a nenechá v textu viset pomlčky navíc', () => {
    const m = reservationDecisionMail({}, true, '');
    expect(m.subject).toContain('Rezervace potvrzena');
    expect(m.text).not.toContain('undefined');
  });
});

describe('vyřízení přihlášky', () => {
  it('přijetí zmíní kategorii a slíbí ozvání', () => {
    const m = registrationDecisionMail({ name: 'Tomáš', parent: 'Eva Nová', team: 'Žáci U15' }, true, 'info@fkkunice.cz');
    expect(m.text).toContain('Eva Nová');
    expect(m.text).toContain('Žáci U15');
    expect(m.text).toContain('prvního tréninku');
  });

  it('zamítnutí nechá dveře otevřené', () => {
    const m = registrationDecisionMail({ name: 'Tomáš' }, false, '');
    expect(m.text).toContain('znovu');
    expect(m.text).not.toContain('undefined');
  });
});

describe('historie odeslaného', () => {
  it('zapíše i neúspěch, aby bylo vidět, že e-mail neodešel', () => {
    const z = historyEntry({ to: 'a@b.cz', subject: 'Test', text: 'ahoj', ok: false, error: 'klíč chybí' });
    expect(z.ok).toBe(false);
    expect(z.error).toBe('klíč chybí');
    expect(z.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('kontrola nastavení', () => {
  // Pojistka proti omylem odeslané poště by hlásila sama sebe — tady jde
  // o hlášky ke konfiguraci, takže ji na dobu testu vypneme.
  beforeEach(() => { process.env.FK_MAIL_LIVE = '1'; });
  afterEach(() => { delete process.env.FK_MAIL_LIVE; });

  it('bez klíče řekne, co chybí', () => {
    delete process.env.RESEND_API_KEY;
    expect(missingMailConfig()).toContain('RESEND_API_KEY');
  });
});

// -----------------------------------------------------------------------------
//  POJISTKA PROTI OMYLEM ODESLANÉ POŠTĚ
//  Klíč v .env.local si načte i vývojový server, takže e2e testy i obyčejné
//  klikání na lokále rozesílaly skutečné e-maily na adresu klubu. Odesílá se
//  proto jen v produkci, jinde je potřeba to říct výslovně.
// -----------------------------------------------------------------------------
describe('pojistka proti omylem odeslané poště', () => {
  const puvodniNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'platny-klic';
    process.env.MAIL_FROM = 'info@fkkunice.cz';
    delete process.env.FK_MAIL_LIVE;
  });

  afterEach(() => {
    process.env.NODE_ENV = puvodniNodeEnv;
    delete process.env.RESEND_API_KEY;
    delete process.env.MAIL_FROM;
    delete process.env.FK_MAIL_LIVE;
  });

  // `fetch`, který zaznamená, že se ho někdo pokusil použít
  const sledovanyFetch = () => {
    const volani = [];
    const impl = async (url, opts) => {
      volani.push({ url, body: JSON.parse(opts.body) });
      return { ok: true, status: 200, json: async () => ({ id: 'msg' }) };
    };
    return { volani, impl };
  };

  it('mimo produkci neodešle nic, ani s platným klíčem', async () => {
    process.env.NODE_ENV = 'development';
    const { volani, impl } = sledovanyFetch();

    const out = await sendMail({ to: 'nekdo@example.cz', subject: 'x', text: 'y' }, impl);

    expect(volani).toHaveLength(0);           // na Resend se vůbec nesáhlo
    expect(out.ok).toBe(false);
    expect(out.skipped).toBe(true);           // není to chyba, je to záměr
    expect(out.error).toContain('FK_MAIL_LIVE');
  });

  it('bez nastaveného prostředí (ruční skript) taky neodešle nic', async () => {
    delete process.env.NODE_ENV;
    const { volani, impl } = sledovanyFetch();

    await sendMail({ to: 'nekdo@example.cz', subject: 'x', text: 'y' }, impl);
    expect(volani).toHaveLength(0);
  });

  it('v produkci se posílá normálně', async () => {
    process.env.NODE_ENV = 'production';
    const { volani, impl } = sledovanyFetch();

    const out = await sendMail({ to: 'nekdo@example.cz', subject: 'x', text: 'y' }, impl);
    expect(out.ok).toBe(true);
    expect(volani).toHaveLength(1);
  });

  it('FK_MAIL_LIVE=1 pojistku vědomě vypne', async () => {
    process.env.NODE_ENV = 'development';
    process.env.FK_MAIL_LIVE = '1';
    const { volani, impl } = sledovanyFetch();

    const out = await sendMail({ to: 'nekdo@example.cz', subject: 'x', text: 'y' }, impl);
    expect(out.ok).toBe(true);
    expect(volani).toHaveLength(1);
  });

  it('administrace pozná, že je pošta vypnutá, a řekne proč', async () => {
    process.env.NODE_ENV = 'development';
    const stav = mailStatus();
    expect(stav.configured).toBe(false);
    expect(stav.error).toContain('FK_MAIL_LIVE');
  });
});
