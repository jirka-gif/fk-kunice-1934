'use client';
import { useEffect, useState } from 'react';
import { Hov, Eyebrow } from '@/app/components/ui';
import { COLORS, photo } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';
import { Blok, Text } from '@/app/components/Text';
import { Vyber } from '@/app/components/Vyber';
import { monthGrid, dateKey, czechDate } from '@/lib/rental';

const weekDays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const inputBase = 'width:100%;min-width:0;box-sizing:border-box;border:1px solid #ECEEF1;background:#FAFBFC;border-radius:10px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none';
const inputFocus = 'border-color:#C1121F;background:#fff';
const sipkaStyl = { width: 34, height: 34, borderRadius: 10, border: '1px solid #ECEEF1', background: '#fff', color: '#C1121F', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 };

export default function Pronajem() {
  useRevealEngine();
  const { rentalPlans, rentalFaq, pageTexts } = useContent();
  const PT = pageTexts;
  const areas = rentalPlans.map((p) => p.name);

  const [area, setArea] = useState('');
  const [month, setMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');
  const [dni, setDni] = useState({});      // stav dnů v měsíci z API
  const [sloty, setSloty] = useState(null); // termíny vybraného dne
  const [faqOpen, setFaqOpen] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });
  const [sent, setSent] = useState(false);
  const [chyba, setChyba] = useState('');
  const [odesilam, setOdesilam] = useState(false);
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const aktivniPlocha = area || areas[0] || '';
  const monthKey = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;

  // obsazenost celého měsíce (barvy v kalendáři)
  useEffect(() => {
    if (!aktivniPlocha) return undefined;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/availability?area=${encodeURIComponent(aktivniPlocha)}&month=${monthKey}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        const map = {};
        for (const d of data.days) map[d.date] = d.state;
        setDni(map);
      } catch { /* kalendář zůstane neutrální, poptávku to nezablokuje */ }
    })();
    return () => { alive = false; };
  }, [aktivniPlocha, monthKey, sent]);

  // termíny vybraného dne
  useEffect(() => {
    if (!selDate || !aktivniPlocha) { setSloty(null); return undefined; }
    let alive = true;
    setSloty(null);
    (async () => {
      try {
        const res = await fetch(`/api/availability?area=${encodeURIComponent(aktivniPlocha)}&date=${selDate}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setSloty(data);
      } catch { if (alive) setSloty({ slots: [], freeCount: 0, totalCount: 0 }); }
    })();
    return () => { alive = false; };
  }, [selDate, aktivniPlocha, sent]);

  const cells = monthGrid(month.year, month.month);
  const posunMesic = (delta) => {
    const d = new Date(month.year, month.month + delta, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelDate(''); setSelTime('');
  };

  const vyberDen = (dateISO) => {
    const stav = dni[dateISO];
    if (stav === 'plno' || stav === 'zavřeno' || stav === 'mimo') return;
    setSelDate(dateISO); setSelTime(''); setChyba('');
  };

  const submit = async () => {
    setChyba('');
    if (!form.name.trim()) { setChyba('Vyplň prosím jméno.'); return; }
    if (!selDate) { setChyba('Vyber prosím den v kalendáři.'); return; }
    if (!selTime) { setChyba('Vyber prosím čas.'); return; }

    setOdesilam(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reservation',
          payload: {
            name: form.name.trim(),
            // `contact` zůstává kvůli čitelnému výpisu v administraci,
            // e-mail a telefon jdou navíc zvlášť, aby šlo odepsat.
            contact: [form.phone, form.email].filter(Boolean).join(' · '),
            email: form.email.trim(),
            phone: form.phone.trim(),
            area: aktivniPlocha,
            dateISO: selDate,
            from: selTime,
            note: form.note,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // typicky 409 — termín mezitím někdo zabral
        setChyba(data.error || 'Poptávku se nepodařilo odeslat. Zkus to prosím znovu.');
        setSelTime('');
        return;
      }
      setSent(true);
    } catch {
      setChyba('Server je nedostupný. Zkus to prosím za chvíli.');
    } finally {
      setOdesilam(false);
    }
  };

  const mesicNazev = new Date(month.year, month.month, 1).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
  const dnesKey = dateKey(new Date());

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '148px 0 76px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#2b323e,#11151b)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 85% 0%,rgba(193,18,31,.26),transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <Blok nazev="Úvod stránky" sekce="domu">
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#D62839' }}><Text as="span" cesta="pageTexts.pronajem.eyebrow" hodnota={PT.pronajem.eyebrow} /></span>
          </div>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(54px,8.5vw,118px)', lineHeight: 1.22, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px', maxWidth: 900 }}><Text as="span" cesta="pageTexts.pronajem.title" hodnota={PT.pronajem.title} /></h1>
          <p className="fk-rev" style={{ color: 'rgba(255,255,255,.82)', fontSize: 19, marginTop: 20, maxWidth: 600, lineHeight: 1.55 }}><Text as="span" cesta="pageTexts.pronajem.perex" hodnota={PT.pronajem.perex} viceradkovy /></p>
          </Blok>
        </div>
      </section>

      {/* ============ CENÍK ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24 }}>
          <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>CENÍK</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {rentalPlans.map((rp, i) => {
            const free = rp.status === 'VOLNO';
            return (
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
                <div style={{ height: 170, background: photo(rp.img), backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 14, left: 14, background: free ? '#EAF6EE' : '#FBEAEC', color: free ? '#1F8A4C' : '#C1121F', fontWeight: 800, fontSize: 11, letterSpacing: '.5px', padding: '6px 12px', borderRadius: 10 }}>{rp.status}</span>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, textTransform: 'uppercase', color: '#121212' }}>{rp.name}</div>
                  <div style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{rp.spec}</div>
                  <div style={{ margin: '16px 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rp.features.map((ft, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#3a3f47', fontWeight: 500 }}>
                        <span style={{ color: '#C1121F', fontWeight: 800 }}>✓</span>{ft}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingTop: 16, borderTop: '1px solid #F2F3F5' }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: '#C1121F' }}>{rp.price}</span>
                    <span style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600 }}>/ hodina</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ KALENDÁŘ + FORMULÁŘ ============ */}
      <section className="fk-rent-grid" style={{ maxWidth: 1060, margin: '0 auto', padding: '72px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* kalendář + termíny dne */}
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', marginBottom: 6, textTransform: 'uppercase' }}>Plocha</div>
            <Vyber ariaLabel="Plocha" value={aktivniPlocha} onChange={(v) => { setArea(v); setSelDate(''); setSelTime(''); }} options={areas} placeholder="Vyber plochu" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => posunMesic(-1)} aria-label="Předchozí měsíc" style={sipkaStyl}>‹</button>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#121212', textTransform: 'capitalize' }}>{mesicNazev}</span>
            <button onClick={() => posunMesic(1)} aria-label="Další měsíc" style={sipkaStyl}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
            {weekDays.map((wd) => (
              <div key={wd} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9AA1AC', padding: '4px 0' }}>{wd}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {cells.map((cd, i) => {
              if (!cd.day) return <div key={i} />;
              const stav = dni[cd.dateISO] || 'volno';
              const vybrany = cd.dateISO === selDate;
              const dnes = cd.dateISO === dnesKey;
              const lze = stav === 'volno' || stav === 'částečně';
              const barvy = {
                'volno': { bg: '#EAF6EE', color: '#1F8A4C' },
                'částečně': { bg: '#FDF3E7', color: '#A9702E' },
                'plno': { bg: '#FBEAEC', color: '#C1121F' },
                'zavřeno': { bg: '#F4F5F7', color: '#B7BCC4' },
                'mimo': { bg: '#FAFBFC', color: '#C7CCD3' },
              }[stav];
              return (
                <button
                  key={i}
                  onClick={lze ? () => vyberDen(cd.dateISO) : undefined}
                  disabled={!lze}
                  aria-label={`${cd.day}. ${mesicNazev} — ${stav}`}
                  style={{
                    aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: lze ? 'pointer' : 'not-allowed',
                    border: dnes ? '2px solid #C1121F' : '1px solid transparent',
                    background: vybrany ? '#C1121F' : barvy.bg,
                    color: vybrany ? '#fff' : barvy.color,
                    transition: 'background .2s, color .2s',
                  }}
                >
                  {cd.day}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid #F2F3F5', flexWrap: 'wrap' }}>
            {[['#EAF6EE', '#BfE6CC', 'Volno'], ['#FDF3E7', '#EBD5B8', 'Částečně'], ['#FBEAEC', '#F1C4CA', 'Plno'], ['#C1121F', '#C1121F', 'Vybráno']].map(([bg, br, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: bg, border: `1px solid ${br}` }} />{label}
              </div>
            ))}
          </div>

          {/* termíny vybraného dne */}
          {selDate && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #F2F3F5' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E', marginBottom: 12 }}>
                Volné časy — {czechDate(selDate)}
              </div>
              {!sloty && <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Načítám…</div>}
              {sloty && sloty.freeCount === 0 && (
                <div style={{ fontSize: 13, color: '#C1121F', fontWeight: 700 }}>V tento den už je bohužel plno. Zkus jiný den.</div>
              )}
              {sloty && sloty.freeCount > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(74px,1fr))', gap: 8 }}>
                  {sloty.slots.map((sl) => {
                    const vybrany = sl.time === selTime;
                    return (
                      <button
                        key={sl.time}
                        onClick={sl.free ? () => { setSelTime(sl.time); setChyba(''); } : undefined}
                        disabled={!sl.free}
                        title={sl.free ? 'Volný termín' : sl.reason === 'obsazeno' ? 'Termín je už zabraný' : 'Termín je potřeba poptat dřív'}
                        style={{
                          padding: '11px 6px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                          cursor: sl.free ? 'pointer' : 'not-allowed',
                          border: `1px solid ${vybrany ? '#C1121F' : sl.free ? '#ECEEF1' : 'transparent'}`,
                          background: vybrany ? '#C1121F' : sl.free ? '#fff' : '#F4F5F7',
                          color: vybrany ? '#fff' : sl.free ? '#3a3f47' : '#C7CCD3',
                          textDecoration: sl.free ? 'none' : 'line-through',
                          transition: 'background .2s, color .2s, border-color .2s',
                        }}
                      >
                        {sl.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* formulář */}
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#121212', marginBottom: 6 }}>Poptávka rezervace</div>
          <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginBottom: 20 }}>
            Vybraný termín: <span style={{ color: '#C1121F', fontWeight: 800 }}>{selDate ? `${czechDate(selDate)}${selTime ? `, ${selTime}` : ''}` : '—'}</span>
          </div>
          {sent ? (
            <div style={{ background: '#EAF6EE', border: '1px solid #BfE6CC', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#1F8A4C' }}>Poptávka odeslána</div>
              <div style={{ color: '#3a3f47', fontSize: 14, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>
                Termín jsme vám předběžně zablokovali. Ozveme se do 24 hodin a rezervaci potvrdíme.
              </div>
              <div onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', note: '' }); setSelDate(''); setSelTime(''); }} style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#C1121F', cursor: 'pointer' }}>Odeslat další poptávku</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Hov as="input" value={form.name} onChange={setF('name')} placeholder="Jméno a příjmení" style={inputBase} focus={inputFocus} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Hov as="input" value={form.phone} onChange={setF('phone')} placeholder="Telefon" style={`flex:1 1 150px;${inputBase}`} focus={inputFocus} />
                <Hov as="input" value={form.email} onChange={setF('email')} placeholder="E-mail" style={`flex:1 1 150px;${inputBase}`} focus={inputFocus} />
              </div>
              <Vyber ariaLabel="Plocha k pronájmu" value={aktivniPlocha} onChange={(v) => { setArea(v); setSelTime(''); }} options={areas} placeholder="Vyber plochu" />
              <Hov as="textarea" value={form.note} onChange={setF('note')} placeholder="Poznámka (počet osob, účel)" rows={3} style={`${inputBase};resize:none`} focus={inputFocus} />

              {chyba && (
                <div style={{ background: '#FBEAEC', color: '#C1121F', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>{chyba}</div>
              )}

              <Hov as="a" onClick={odesilam ? undefined : submit} style="text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:16px;border-radius:10px;cursor:pointer;box-shadow:0 12px 30px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-2px);background:#D62839;color:#fff">
                {odesilam ? 'Odesílám…' : 'Odeslat poptávku'}
              </Hov>
              <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, lineHeight: 1.5 }}>
                Odesláním vzniká <b>poptávka</b>, ne závazná rezervace — termín vám podržíme a klub ji potvrdí.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ ČASTÉ DOTAZY ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 28px 110px' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>ČASTÉ DOTAZY</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {rentalFaq.map((fq, i) => {
            const open = !!faqOpen[i];
            return (
              <div
                key={i}
                className="fk-rev"
                onClick={() => setFaqOpen((s) => ({ ...s, [i]: !s[i] }))}
                style={{ background: '#fff', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{fq.q}</span>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#C1121F', lineHeight: 1 }}>{open ? '–' : '+'}</span>
                </div>
                <div style={{ overflow: 'hidden', maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, marginTop: open ? 12 : 0, transition: 'max-height .3s,opacity .3s,margin-top .3s', fontSize: 14, lineHeight: 1.6, color: '#6B7280' }}>{fq.a}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
