'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useData, resetData, exportJson, updateData, onSaveStatus } from '@/lib/store';
import { Card, Btn } from './adminui';
import { Icon } from '../components/icons';
import { Nastaveni, Domu, Tymy, Zapasy, Novinky, Kempy, Pronajem, Kontakt, Partneri, Registrace, Zpravy } from './sections';
import { Uzivatele } from './users';
import { Socialni } from './social';
import { ZmenaHesla } from './account';
import { ADMIN_SECTIONS, canView, canEdit } from '@/lib/permissions';

const RED = '#C1121F';

export default function Admin() {
  const d = useData();
  const [section, setSectionId] = useState('prehled');
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // kdo je přihlášený a co smí — bez toho administraci nevykreslujeme
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.status === 401) { window.location.href = '/admin/login?from=%2Fadmin'; return; }
        const data = await res.json();
        if (alive) setMe(data.user);
      } catch {
        // necháme prázdné — zobrazí se hláška níž
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // hlášky o ukládání (např. odmítnutá změna kvůli oprávnění)
  useEffect(() => onSaveStatus(setSaveStatus), []);

  const perms = me ? me.permissions : null;
  const visibleSections = ADMIN_SECTIONS.filter((s) => canView(perms, s.id));
  // „ucet" (změna vlastního hesla) je dostupný vždy, bez ohledu na roli
  const allowedIds = [...visibleSections.map((s) => s.id), 'ucet'].join(',');

  // když uživatel na aktuální sekci nemá právo, přepneme ho na první dostupnou
  useEffect(() => {
    if (!me) return;
    const ids = allowedIds.split(',');
    if (!ids.includes(section)) setSectionId(ids[0] || '');
  }, [me, section, allowedIds]);

  const playersTotal = d.teams.reduce((s, t) => s + t.players.length, 0);
  const coachesTotal = d.teams.reduce((s, t) => s + t.coaches.length, 0);

  // reálné počty toho, co čeká na vyřízení (dřív tu byla vymyšlená čísla)
  const newMessages = d.messages.filter((m) => m.status !== 'vyřízená').length;
  const newReservations = d.reservations.filter((r) => r.status === 'nová').length;
  const newRegistrations = d.cmsRegistrations.filter((r) => r.tg === 'new').length;
  const activeCamps = d.camps.filter((c) => !c.archived).length;
  // nejbližší zápasy podle termínů vyplněných u týmů (dřív tu byl vymyšlený seznam)
  const upcoming = d.teams
    .filter((t) => t.nextMatch && t.nextMatch.dateISO && !isNaN(new Date(t.nextMatch.dateISO)))
    .map((t) => ({ team: t.name, when: new Date(t.nextMatch.dateISO), match: `${t.nextMatch.home.name} – ${t.nextMatch.away.name}` }))
    .sort((a, b) => a.when - b.when)
    .slice(0, 5)
    .map((m) => ({ ...m, time: `${m.when.getDate()}. ${m.when.getMonth() + 1}. ${String(m.when.getHours()).padStart(2, '0')}:${String(m.when.getMinutes()).padStart(2, '0')}` }));

  const todo = [
    { label: 'Nové zprávy', value: newMessages, go: 'zpravy', hint: 'z kontaktního formuláře' },
    { label: 'Nové rezervace', value: newReservations, go: 'pronajem', hint: 'poptávky pronájmu' },
    { label: 'Nové registrace', value: newRegistrations, go: 'registrace', hint: 'přihlášky do klubu' },
    { label: 'Vypsané kempy', value: activeCamps, go: 'kempy', hint: `${d.camps.length - activeCamps} v archivu` },
  ];

  const BADGES = {
    tymy: String(d.teams.length),
    novinky: String(d.news.length),
    zpravy: String(d.messages.filter((m) => m.status !== 'vyřízená').length),
    registrace: String(d.cmsRegistrations.length),
    socialni: String(d.socialPosts.filter((p) => p.status !== 'odesláno').length),
  };
  const NAV = visibleSections.map((s) => ({ ...s, badge: BADGES[s.id] }));

  const doExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fk-kunice-obsah.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const doReset = () => { if (confirm('Obnovit veškerý obsah na původní (z webu)? Tvoje úpravy budou ztraceny.')) resetData(); };
  const doLogout = async () => {
    try { await fetch('/api/logout', { method: 'POST' }); } catch {}
    window.location.href = '/admin/login';
  };

  const SECTIONS = { domu: Domu, zpravy: Zpravy, tymy: Tymy, zapasy: Zapasy, novinky: Novinky, kempy: Kempy, pronajem: Pronajem, kontakt: Kontakt, partneri: Partneri, registrace: Registrace, socialni: Socialni, nastaveni: Nastaveni, uzivatele: Uzivatele };
  const Current = SECTIONS[section];
  const readOnly = !canEdit(perms, section);
  const canEditReservations = canEdit(perms, 'pronajem');

  if (loadingMe) {
    return <section className="fk-admin" style={{ maxWidth: 1320, margin: '0 auto', padding: '140px 24px 80px', color: '#9AA1AC', fontWeight: 600 }}>Načítám administraci…</section>;
  }
  if (!me) {
    return (
      <section className="fk-admin" style={{ maxWidth: 720, margin: '0 auto', padding: '140px 24px 80px' }}>
        <Card>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: '#121212' }}>Administrace se nenačetla</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 1.6 }}>Nepodařilo se ověřit přihlášení. Zkus to prosím znovu.</div>
          <div style={{ marginTop: 14 }}><Link href="/admin/login" style={{ fontWeight: 700, color: RED, fontSize: 14 }}>Přejít na přihlášení →</Link></div>
        </Card>
      </section>
    );
  }

  return (
    <section className="fk-admin" style={{ maxWidth: 1320, margin: '0 auto', padding: '104px 24px 80px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
      {/* SIDEBAR */}
      <div className="fk-admin-side" style={{ position: 'sticky', top: 96, background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 16px', borderBottom: '1px solid #F2F3F5', marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', border: '1px solid #ECEEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
            <Image src="/logo.webp" alt="" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div><div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: '#121212', letterSpacing: '.3px' }}>FK KUNICE</div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#9AA1AC' }}>ADMIN</div></div>
        </div>
        {NAV.map((n) => {
          const active = section === n.id;
          return (
            <div key={n.id} data-sec={n.id} onClick={() => setSectionId(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 3, ...(active ? { background: '#FBEAEC', color: RED } : { color: '#3a3f47' }) }}>
              <span style={{ display: 'inline-flex', width: 19, justifyContent: 'center' }}><Icon name={n.icon} size={19} /></span><span>{n.label}</span>
              {n.badge && <span style={{ marginLeft: 'auto', background: active ? RED : '#EFF1F4', color: active ? '#fff' : '#9AA1AC', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{n.badge}</span>}
            </div>
          );
        })}
        <div style={{ borderTop: '1px solid #F2F3F5', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '2px 4px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name || me.email}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA1AC' }}>{me.roleName}</div>
          </div>
          <Btn kind="ghost" small onClick={() => setSectionId('ucet')}>Změnit heslo</Btn>
          {canEdit(perms, 'nastaveni') && <Btn kind="dark" onClick={doExport}>⤓ Export dat (JSON)</Btn>}
          {canEdit(perms, 'nastaveni') && <Btn kind="ghost" small onClick={doReset}>Obnovit původní</Btn>}
          <Btn kind="ghost" small onClick={doLogout}>Odhlásit se</Btn>
          <Link href="/" style={{ fontSize: 12, fontWeight: 700, color: '#9AA1AC', textAlign: 'center', padding: 6 }}>← Zpět na web</Link>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ minWidth: 0 }}>
        {saveStatus && saveStatus.state === 'error' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FBEAEC', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED, fontWeight: 700, marginBottom: 20, lineHeight: 1.5 }}>
            <span>{saveStatus.message} Změna zůstala jen v tomto prohlížeči — po obnovení stránky zmizí.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fff', borderRadius: 10, border: '1px solid #ECEEF1', padding: '12px 16px', fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
            <span style={{ flex: 'none', color: '#1F8A4C', marginTop: 1 }}><Icon name="checkCircle" size={17} /></span>
            <span>
              {saveStatus && saveStatus.state === 'saving' ? 'Ukládám změny…'
                : saveStatus && saveStatus.state === 'saved' ? 'Změny uloženy na server.'
                : 'Administrace je plně funkční — úpravy se ukládají automaticky a hned se projeví na webu.'}
            </span>
          </div>
        )}

        {section === 'prehled' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div><div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#121212', letterSpacing: '.3px' }}>Přehled</div><div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>{d.club.fullName}</div></div>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>PD</div>
            </div>

            {/* co čeká na vyřízení — reálné počty z obsahu webu */}
            <div className="fk-admin-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
              {todo.map((c, i) => (
                <Card key={i} style={{ cursor: 'pointer' }}>
                  <div onClick={() => setSectionId(c.go)}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA1AC', letterSpacing: '.5px' }}>{c.label}</div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: c.value > 0 ? RED : '#121212', marginTop: 8, lineHeight: 1 }}>{c.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: '#9AA1AC' }}>{c.hint}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* reálný obsah webu */}
            <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Obsah webu</div>
            <div className="fk-admin-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { n: d.teams.length, l: 'Týmů', go: 'tymy' },
                { n: playersTotal, l: 'Hráčů', go: 'tymy' },
                { n: coachesTotal, l: 'Trenérů', go: 'tymy' },
                { n: d.news.length, l: 'Novinek', go: 'novinky' },
                { n: d.teams.reduce((s, t) => s + ((t.results && t.results.length) || 0), 0), l: 'Výsledků', go: 'zapasy' },
                { n: d.rentalPlans.length, l: 'Ploch k pronájmu', go: 'pronajem' },
                { n: d.sponsors.length, l: 'Partnerů', go: 'partneri' },
                { n: d.people.length, l: 'Kontaktů', go: 'kontakt' },
              ].map((k, i) => (
                <Card key={i} style={{ cursor: 'pointer' }}>
                  <div onClick={() => setSectionId(k.go)}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: RED, lineHeight: 1 }}>{k.n}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA1AC', marginTop: 6 }}>{k.l} <span style={{ color: '#C7CCD3' }}>· upravit →</span></div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="fk-admin-grid2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontWeight: 800, fontSize: 15 }}>Nové registrace</span><span onClick={() => setSectionId('registrace')} style={{ fontSize: 12, fontWeight: 700, color: RED, cursor: 'pointer' }}>Zobrazit vše</span></div>
                {d.cmsRegistrations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{r.ini}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{r.name}</div><div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{r.team}</div></div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 10, ...(r.tg === 'new' ? { background: '#FBEAEC', color: RED } : r.tg === 'ok' ? { background: '#EAF6EE', color: '#1F8A4C' } : { background: '#F4F5F7', color: '#9AA1AC' }) }}>{r.tag}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontWeight: 800, fontSize: 15 }}>Nejbližší zápasy</span><span onClick={() => setSectionId('zapasy')} style={{ fontSize: 12, fontWeight: 700, color: RED, cursor: 'pointer' }}>Upravit</span></div>
                {upcoming.length === 0 && (
                  <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, padding: '8px 0' }}>Žádný tým nemá vyplněný termín příštího zápasu.</div>
                )}
                {upcoming.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 0', borderBottom: '1px solid #F2F3F5' }}>
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, color: '#1E1E1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.match}</div><div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{m.team}</div></div>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: RED, flex: 'none' }}>{m.time}</span>
                  </div>
                ))}
              </Card>
            </div>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontWeight: 800, fontSize: 15 }}>Nové rezervace</span><span onClick={() => setSectionId('pronajem')} style={{ fontSize: 12, fontWeight: 700, color: RED, cursor: 'pointer' }}>Spravovat</span></div>
              {d.reservations.filter((r) => r.status === 'nová').length === 0 && (
                <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, padding: '8px 0' }}>Žádné nové rezervace k vyřízení.</div>
              )}
              {d.reservations.filter((r) => r.status === 'nová').slice(0, 6).map((r) => {
                const idx = d.reservations.indexOf(r);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{r.name} {r.source === 'web' ? <span style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC' }}>· WEB</span> : <span style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC' }}>· {String(r.source || '').toUpperCase()}</span>}</div>
                      <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{[r.area, r.date, r.time].filter(Boolean).join(' · ')}</div>
                    </div>
                    {canEditReservations && (
                      <>
                        <span title="Potvrdit" onClick={() => updateData((dd) => { dd.reservations[idx].status = 'potvrzená'; })} style={{ width: 30, height: 30, borderRadius: 10, background: '#EAF6EE', color: '#1F8A4C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer' }}>✓</span>
                        <span title="Zamítnout" onClick={() => updateData((dd) => { dd.reservations[idx].status = 'zamítnutá'; })} style={{ width: 30, height: 30, borderRadius: 10, background: '#FBEAEC', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer' }}>✕</span>
                      </>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ) : section === 'ucet' ? (
          <ZmenaHesla me={me} />
        ) : !Current ? (
          <Card>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#121212' }}>Tady zatím nic není</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Tvoje role nemá přístup k žádné sekci administrace. Ozvi se správci webu.</div>
          </Card>
        ) : readOnly ? (
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F4F5F7', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6B7280', fontWeight: 700, marginBottom: 16 }}>
              Tuhle sekci máš jen pro čtení — úpravy ti server neuloží.
            </div>
            {/* fieldset s disabled vypne všechna pole i tlačítka uvnitř */}
            <fieldset disabled style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              <Current />
            </fieldset>
          </div>
        ) : (
          <Current />
        )}
      </div>
    </section>
  );
}
