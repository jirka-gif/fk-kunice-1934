'use client';
import { useState } from 'react';
import { Hov, Eyebrow } from '@/app/components/ui';
import { COLORS, photo } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { Icon } from '@/app/components/icons';
import { useContent, updateData } from '@/lib/store';

const weekDays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const inputBase = 'border:1px solid #ECEEF1;background:#FAFBFC;border-radius:13px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none';
const inputFocus = 'border-color:#C1121F;background:#fff';

export default function Pronajem() {
  useRevealEngine();
  const { rentalPlans, rentalBusyDays, rentalFaq } = useContent();
  const [selDay, setSelDay] = useState(18);
  const [faqOpen, setFaqOpen] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '', note: '' });
  const [sent, setSent] = useState(false);
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ===== Kalendář: 2 vodicí prázdné buňky, dny 1..31, doplnit do 35 =====
  const calendar = [];
  for (let i = 0; i < 2; i++) calendar.push({ day: '', busy: false, sel: false });
  for (let d = 1; d <= 31; d++) {
    const isBusy = rentalBusyDays.includes(d);
    const isSel = d === selDay;
    calendar.push({ day: d, busy: isBusy, sel: isSel });
  }
  while (calendar.length < 35) calendar.push({ day: '', busy: false, sel: false });

  const selDayLabel = selDay ? `${selDay}. července 2026` : '—';

  const submit = () => {
    if (!form.name.trim()) { alert('Vyplň prosím jméno.'); return; }
    updateData((d) => {
      d.reservations = [
        { name: form.name.trim(), contact: [form.phone, form.email].filter(Boolean).join(' · '), area: form.area || (rentalPlans[0] && rentalPlans[0].name) || '', date: selDayLabel, time: '', note: form.note, source: 'web', status: 'nová' },
        ...(d.reservations || []),
      ];
    });
    setSent(true);
  };

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '148px 0 76px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#2b323e,#11151b)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 85% 0%,rgba(193,18,31,.26),transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#D62839' }}>PRONÁJEM AREÁLU</span>
          </div>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(54px,8.5vw,118px)', lineHeight: 1.22, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px', maxWidth: 900 }}>Pronajmi si naše hřiště</h1>
          <p className="fk-rev" style={{ color: 'rgba(255,255,255,.82)', fontSize: 19, marginTop: 20, maxWidth: 600, lineHeight: 1.55 }}>Travnaté hřiště, umělá tráva i tréninková plocha s osvětlením — pro firemní akce, turnaje i pravidelný trénink.</p>
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
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
                <div style={{ height: 170, background: photo(rp.img), backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 14, left: 14, background: free ? '#EAF6EE' : '#FBEAEC', color: free ? '#1F8A4C' : '#C1121F', fontWeight: 800, fontSize: 11, letterSpacing: '.5px', padding: '6px 12px', borderRadius: 99 }}>{rp.status}</span>
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
      <section className="fk-rent-grid" style={{ maxWidth: 960, margin: '0 auto', padding: '72px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* kalendář */}
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 22, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#121212' }}>Červenec 2026</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9AA1AC' }}>Vyber termín</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
            {weekDays.map((wd) => (
              <div key={wd} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9AA1AC', padding: '4px 0' }}>{wd}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {calendar.map((cd, i) => {
              if (cd.day === '') return <div key={i} />;
              let bg = '#EAF6EE', color = '#1F8A4C', cur = 'pointer';
              if (cd.busy) { bg = '#FBEAEC'; color = '#C1121F'; cur = 'not-allowed'; }
              if (cd.sel) { bg = '#C1121F'; color = '#fff'; }
              return (
                <div
                  key={i}
                  onClick={cd.busy ? undefined : () => setSelDay(cd.day)}
                  style={{ aspectRatio: '1', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: bg, color, cursor: cur }}
                >
                  {cd.day}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 16, borderTop: '1px solid #F2F3F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: '#EAF6EE', border: '1px solid #BfE6CC' }} />Volno
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: '#FBEAEC', border: '1px solid #F1C4CA' }} />Obsazeno
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: '#C1121F' }} />Vybráno
            </div>
          </div>
        </div>

        {/* formulář */}
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 22, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#121212', marginBottom: 6 }}>Poptávka rezervace</div>
          <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginBottom: 20 }}>Vybraný termín: <span style={{ color: '#C1121F', fontWeight: 800 }}>{selDayLabel}</span></div>
          {sent ? (
            <div style={{ background: '#EAF6EE', border: '1px solid #BfE6CC', borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#1F8A4C' }}><Icon name="checkCircle" size={40} strokeWidth={1.7} /></div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#1F8A4C' }}>Poptávka odeslána</div>
              <div style={{ color: '#3a3f47', fontSize: 14, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>Děkujeme! Ozveme se vám do 24 hodin a potvrdíme dostupnost termínu.</div>
              <div onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', area: '', note: '' }); }} style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#C1121F', cursor: 'pointer' }}>Odeslat další poptávku</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Hov as="input" value={form.name} onChange={setF('name')} placeholder="Jméno a příjmení" style={inputBase} focus={inputFocus} />
              <div style={{ display: 'flex', gap: 12 }}>
                <Hov as="input" value={form.phone} onChange={setF('phone')} placeholder="Telefon" style={`flex:1;${inputBase}`} focus={inputFocus} />
                <Hov as="input" value={form.email} onChange={setF('email')} placeholder="E-mail" style={`flex:1;${inputBase}`} focus={inputFocus} />
              </div>
              <select value={form.area || (rentalPlans[0] && rentalPlans[0].name) || ''} onChange={setF('area')} style={{ border: '1px solid #ECEEF1', background: '#FAFBFC', borderRadius: 13, padding: '14px 16px', fontSize: 14, fontFamily: 'Inter', color: '#1E1E1E', outline: 'none' }}>
                {rentalPlans.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
              </select>
              <Hov as="textarea" value={form.note} onChange={setF('note')} placeholder="Poznámka (počet osob, čas, účel)" rows={3} style={`${inputBase};resize:none`} focus={inputFocus} />
              <Hov as="a" onClick={submit} style="text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:16px;border-radius:14px;cursor:pointer;box-shadow:0 12px 30px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-2px);background:#D62839;color:#fff">Odeslat poptávku →</Hov>
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
                style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05)', cursor: 'pointer' }}
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
