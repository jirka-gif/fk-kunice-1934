'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Hov, Eyebrow } from '@/app/components/ui';
import { Icon, emojiIcon } from '@/app/components/icons';
import { COLORS, photo } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

const cardSh = '0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05)';

const cdBoxesCamp = [
  { key: 'd', label: 'DNÍ', init: '00' },
  { key: 'h', label: 'HOD', init: '00' },
  { key: 'm', label: 'MIN', init: '00' },
  { key: 's', label: 'SEK', init: '00' },
];

export default function Kempy() {
  useRevealEngine();
  const [faqOpen, setFaqOpen] = useState({});

  const { campDetail } = useContent();
  const { badge, title, lead, price, term, capacity, perks, program, includes, coaches, faq } = campDetail;
  const remaining = capacity.total - capacity.taken;
  const barWidth = (capacity.taken / capacity.total) * 100;

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '150px 0 80px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#b15f2c,#291a13)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,10,11,.42),rgba(10,10,11,.88))' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '1.5px', padding: '8px 15px', borderRadius: 99, marginBottom: 20 }}>{badge}</div>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(54px,8.5vw,118px)', lineHeight: 1.22, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px', maxWidth: 900 }}>{title}</h1>
          <p className="fk-rev" style={{ color: 'rgba(255,255,255,.85)', fontSize: 19, marginTop: 20, maxWidth: 580, lineHeight: 1.55 }}>{lead}</p>
        </div>
      </section>

      {/* ============ BODY ============ */}
      <section className="fk-camp-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px 110px', display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          {/* PROČ NÁŠ KEMP */}
          <div className="fk-rev"><Eyebrow>PROČ NÁŠ KEMP</Eyebrow></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 52 }}>
            {perks.map((cp, i) => (
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: cardSh, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, background: 'rgba(193,18,31,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emojiIcon(cp.emoji) ? <Icon name={emojiIcon(cp.emoji)} size={20} color={COLORS.red} /> : <span style={{ fontSize: 20 }}>{cp.emoji}</span>}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{cp.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginTop: 3 }}>{cp.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* DENNÍ PROGRAM */}
          <div className="fk-rev"><Eyebrow>DENNÍ PROGRAM</Eyebrow></div>
          <div style={{ position: 'relative', paddingLeft: 30, marginBottom: 52 }}>
            <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: '#ECEEF1' }} />
            {program.map((pr, i) => (
              <div key={i} className="fk-rev" style={{ position: 'relative', marginBottom: 22 }}>
                <span style={{ position: 'absolute', left: -30, top: 3, width: 16, height: 16, borderRadius: 99, background: '#C1121F', border: '3px solid #F6F7F9', boxShadow: '0 0 0 2px #C1121F' }} />
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#C1121F', letterSpacing: '.5px' }}>{pr.time}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E', marginTop: 2 }}>{pr.title}</div>
              </div>
            ))}
          </div>

          {/* TRENÉŘI KEMPU */}
          <div className="fk-rev"><Eyebrow>TRENÉŘI KEMPU</Eyebrow></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 52 }}>
            {coaches.map((st, i) => (
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)' }}>
                <div style={{ height: 120, background: photo(st.img), backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{st.name}</div>
                  <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>{st.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ČASTÉ DOTAZY */}
          <div className="fk-rev"><Eyebrow>ČASTÉ DOTAZY</Eyebrow></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faq.map((fq, i) => {
              const open = !!faqOpen[i];
              return (
                <div key={i} className="fk-rev" onClick={() => setFaqOpen((o) => ({ ...o, [i]: !o[i] }))} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: cardSh, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{fq.q}</span>
                    <span style={{ fontFamily: 'Anton', fontSize: 24, color: '#C1121F', width: 22, textAlign: 'center', flex: 'none', lineHeight: 1 }}>{open ? '–' : '+'}</span>
                  </div>
                  <div style={{ overflow: 'hidden', color: '#6B7280', fontSize: 14, lineHeight: 1.6, ...(open ? { maxHeight: 240, marginTop: 12, opacity: 1 } : { maxHeight: 0, opacity: 0 }) }}>{fq.a}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ STICKY PRICE CARD ============ */}
        <div style={{ position: 'sticky', top: 96 }}>
          <div className="fk-rev" style={{ background: '#fff', borderRadius: 22, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.05),0 20px 50px rgba(18,18,18,.12)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 46, color: '#121212', letterSpacing: '.5px' }}>{price}</span>
              <span style={{ color: '#9AA1AC', fontSize: 14, fontWeight: 600 }}>/ dítě</span>
            </div>
            <div style={{ color: '#6B7280', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{term}</div>
            <div style={{ margin: '22px 0 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                <span style={{ color: '#C1121F' }}>Zbývá {remaining} míst</span>
                <span style={{ color: '#9AA1AC' }}>{capacity.taken} / {capacity.total} obsazeno</span>
              </div>
              <div style={{ height: 9, borderRadius: 99, background: '#EFF1F4', overflow: 'hidden' }}>
                <div style={{ width: `${barWidth}%`, height: '100%', background: 'linear-gradient(90deg,#C1121F,#D62839)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {cdBoxesCamp.map((cb) => (
                <div key={cb.key} style={{ flex: 1, background: '#F6F7F9', borderRadius: 12, padding: '11px 4px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#121212' }}><span data-cd-camp={cb.key}>{cb.init}</span></div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.5px', color: '#9AA1AC', marginTop: 3 }}>{cb.label}</div>
                </div>
              ))}
            </div>
            <Hov as={Link} href="/kontakt" style="display:block;text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:17px;border-radius:16px;cursor:pointer;box-shadow:0 14px 34px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-3px);background:#D62839;color:#fff">Registrovat dítě →</Hov>
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid #F2F3F5' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#9AA1AC', marginBottom: 12 }}>V CENĚ JE</div>
              {includes.map((ci, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <span style={{ color: '#C1121F', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 14, color: '#3a3f47', fontWeight: 500 }}>{ci}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
