'use client';
import { useState } from 'react';
import { Hov, Eyebrow } from '@/app/components/ui';
import { COLORS, PH, photo } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { articles, newsCategories } from '@/content/club';

export default function Novinky() {
  useRevealEngine();
  const [newsCat, setNewsCat] = useState('Vše');

  const shown = newsCat === 'Vše' ? articles : articles.filter((a) => a._c === newsCat);

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '128px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>MAGAZÍN</span>
        </div>
        <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(48px,7vw,96px)', lineHeight: 1.12, textTransform: 'uppercase', color: '#121212', letterSpacing: '.5px', marginBottom: 36 }}>Ze života klubu</h1>
        <Hov className="fk-rev fk-zoom" style="border-radius:24px;overflow:hidden;position:relative;cursor:pointer;min-height:420px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
          <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: PH.red, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 28%,rgba(10,10,11,.92))' }} />
          <div style={{ position: 'relative', padding: 42, maxWidth: 680 }}>
            <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 99 }}>REPORTÁŽ · HLAVNÍ STORY</span>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4vw,54px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, marginTop: 18, letterSpacing: '.4px' }}>Áčko slaví postup do okresního přeboru</div>
            <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 16, marginTop: 14, lineHeight: 1.55, maxWidth: 540 }}>Historický okamžik pro klub. Po dramatické sezóně a vítězství v posledním kole slaví naše áčko zasloužený postup.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, color: 'rgba(255,255,255,.65)', fontSize: 13, fontWeight: 600 }}><span>Jan Novák</span><span>·</span><span>14. června 2026</span><span>·</span><span>5 min čtení</span></div>
          </div>
        </Hov>
      </section>

      {/* ============ CATEGORY FILTER ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 30 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {newsCategories.map((c) => {
              const active = newsCat === c;
              return (
                <span key={c} onClick={() => setNewsCat(c)} style={{ fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 99, cursor: 'pointer', transition: 'all .2s', ...(active ? { background: '#C1121F', color: '#fff' } : { background: '#fff', color: '#3a3f47', border: '1px solid #ECEEF1' }) }}>{c}</span>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 13, padding: '11px 16px', minWidth: 240 }}>
            <span style={{ color: '#9AA1AC' }}>⌕</span>
            <input placeholder="Hledat v novinkách…" style={{ border: 'none', outline: 'none', background: 'none', fontFamily: 'Inter', fontSize: 14, color: '#1E1E1E', width: '100%' }} />
          </div>
        </div>
      </section>

      {/* ============ ARTICLE GRID ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 110px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {shown.map((a, i) => (
            <Hov key={i} className="fk-rev fk-zoom" style="background:#fff;border-radius:20px;overflow:hidden;cursor:pointer;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06);transition:transform .35s,box-shadow .35s" hover="transform:translateY(-8px);box-shadow:0 28px 56px rgba(18,18,18,.15)">
              <div className="fk-zi" style={{ height: 190, background: photo(a.img), backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', color: '#C1121F' }}>{a.cat}</span>
                  <span style={{ fontSize: 11, color: '#C7CCD3' }}>·</span>
                  <span style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 600 }}>{a.read}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.25, color: '#1E1E1E' }}>{a.title}</div>
                <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>{a.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid #F2F3F5' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 99, background: a.authorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{a.authorIni}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#3a3f47' }}>{a.author}</span>
                  <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginLeft: 'auto' }}>{a.date}</span>
                </div>
              </div>
            </Hov>
          ))}
        </div>
        <div className="fk-rev" style={{ textAlign: 'center', marginTop: 40 }}>
          <Hov as="a" style="display:inline-block;background:#fff;color:#121212;font-weight:700;font-size:15px;padding:15px 32px;border-radius:14px;cursor:pointer;box-shadow:0 1px 2px rgba(18,18,18,.05),0 8px 24px rgba(18,18,18,.06);transition:transform .2s" hover="transform:translateY(-2px)">Načíst další články</Hov>
        </div>
      </section>
    </div>
  );
}
