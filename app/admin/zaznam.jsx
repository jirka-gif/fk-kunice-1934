'use client';
// =============================================================================
//  ZÁZNAM ZMĚN A PŘIHLÁŠENÍ — vidí jen Super správce
//  Kdo, kdy a co změnil v administraci nebo přímo na webu, a kdo se kdy
//  přihlásil. Data čte z /api/audit, které samo hlídá oprávnění.
// =============================================================================
import { useEffect, useState } from 'react';
import { Card, Btn, SectionHead, Select } from './adminui';
import { AKCE_POPIS } from '@/lib/audit-akce';
import { sectionLabel } from '@/lib/permissions';

// Klíč obsahu → sekce, ve které se upravuje. Ať je v záznamu čitelné
// „Novinky" místo „news".
const KLIC_POPIS = {
  homeTexts: 'Texty hlavní stránky', pageTexts: 'Texty stránek', footer: 'Patička',
  whyCards: 'Karty Proč my', gallery: 'Galerie', teams: 'Týmy', news: 'Novinky',
  camps: 'Kempy', rentalPlans: 'Plochy k pronájmu', rentalFaq: 'Dotazy k pronájmu',
  reservations: 'Rezervace', rentalSettings: 'Nastavení pronájmu', quickActions: 'Dlaždice kontaktu',
  people: 'Kontakty', messages: 'Zprávy', sponsors: 'Partneři', cmsRegistrations: 'Přihlášky',
  socialPosts: 'Příspěvky na sítě', socialSettings: 'Nastavení sítí', matchProposals: 'Návrhy zápasů',
  matchesSync: 'Stahování zápasů', opponents: 'Soupeři', club: 'Údaje klubu',
};

function citelnyDetail(z) {
  if (z.akce !== 'obsah-zmena') return z.detail;
  return z.detail
    .split(',')
    .map((k) => KLIC_POPIS[k.trim()] || k.trim())
    .join(', ');
}

function kdy(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function odznak(akce) {
  const barvy = {
    'obsah-zmena': { background: '#FBEAEC', color: '#C1121F' },
    'prihlaseni-ok': { background: '#EAF6EE', color: '#1F8A4C' },
    'prihlaseni-chyba': { background: '#FDF0E7', color: '#B45309' },
    'uzivatel-zmena': { background: '#EEF2FB', color: '#3B5BA5' },
    'role-zmena': { background: '#EEF2FB', color: '#3B5BA5' },
  };
  return { fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 10, whiteSpace: 'nowrap', ...(barvy[akce] || barvy['obsah-zmena']) };
}

export function Zaznam() {
  const [zaznamy, setZaznamy] = useState([]);
  const [celkem, setCelkem] = useState(0);
  const [akce, setAkce] = useState('');
  const [nacitam, setNacitam] = useState(true);
  const [chyba, setChyba] = useState('');

  const nacti = async (filtr = akce) => {
    setNacitam(true); setChyba('');
    try {
      const res = await fetch(`/api/audit?limit=200${filtr ? `&akce=${encodeURIComponent(filtr)}` : ''}`, { cache: 'no-store' });
      if (!res.ok) { setChyba('Záznam se nepodařilo načíst.'); return; }
      const data = await res.json();
      setZaznamy(data.zaznamy || []);
      setCelkem(data.celkem || 0);
    } catch {
      setChyba('Server je nedostupný.');
    } finally {
      setNacitam(false);
    }
  };

  useEffect(() => { nacti(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = '150px 190px 150px 1fr';
  const cell = { padding: '11px 14px', fontSize: 13, display: 'flex', alignItems: 'center', minWidth: 0 };

  return (
    <div>
      <SectionHead
        title="Záznam změn"
        desc="Kdo, kdy a co změnil na webu nebo v administraci, a kdo se přihlásil. Vidí jen Super správce."
        count={celkem}
        akce={<Btn small onClick={() => nacti()}>Načíst znovu</Btn>}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240 }}>
          <Select
            label="" value={akce}
            onChange={(v) => { setAkce(v); nacti(v); }}
            options={[{ value: '', label: 'Všechny akce' }, ...Object.entries(AKCE_POPIS).map(([value, label]) => ({ value, label }))]}
          />
        </div>
      </div>

      {chyba && <Card style={{ marginBottom: 12, color: '#C1121F', fontWeight: 700, fontSize: 13 }}>{chyba}</Card>}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: 'grid', gridTemplateColumns: cols, background: '#FAFBFC', borderBottom: '1px solid #ECEEF1', fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC' }}>
              <div style={cell}>KDY</div>
              <div style={cell}>KDO</div>
              <div style={cell}>AKCE</div>
              <div style={cell}>CO</div>
            </div>

            {nacitam && <div style={{ padding: 24, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Načítám…</div>}

            {!nacitam && zaznamy.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Zatím tu nic není.</div>
            )}

            {!nacitam && zaznamy.map((z) => (
              <div key={z.id} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid #F2F3F5', alignItems: 'center' }}>
                <div style={{ ...cell, color: '#9AA1AC', fontWeight: 600 }}>{kdy(z.at)}</div>
                <div style={{ ...cell, fontWeight: 700, color: '#1E1E1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {z.userName || z.userEmail || '—'}
                </div>
                <div style={cell}><span style={odznak(z.akce)}>{AKCE_POPIS[z.akce] || z.akce}</span></div>
                <div style={{ ...cell, color: '#3a3f47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={citelnyDetail(z)}>
                  {citelnyDetail(z) || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
        Drží se posledních 1000 záznamů. Ukládá se, které části webu se změnily — ne jejich obsah,
        a nikdy hesla. Sekce {sectionLabel('zaznam')} patří jen roli Super správce.
      </div>
    </div>
  );
}
