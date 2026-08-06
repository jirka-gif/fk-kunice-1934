// Texty e-mailů žadateli — čistá logika, nic se neodesílá.
import { describe, it, expect } from 'vitest';
import { reservationDecisionMail, registrationDecisionMail, historyEntry, missingMailConfig } from '@/lib/mail';

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
  it('bez klíče řekne, co chybí', () => {
    delete process.env.RESEND_API_KEY;
    expect(missingMailConfig()).toContain('RESEND_API_KEY');
  });
});
