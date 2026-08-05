'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Hov } from '@/app/components/ui';
import { PH_ARR } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

const bg = (item, i) => (item && item.image ? `url(${item.image})` : PH_ARR[i % PH_ARR.length]);
const PER_PAGE = 6; // kolik novinek se vejde na jednu stránku (pod hlavní novinkou)

export default function Novinky() {
  useRevealEngine();
  const { news, newsCategories } = useContent();
  const [cat, setCat] = useState('Vše');
  const [page, setPage] = useState(1);

  const shown = cat === 'Vše' ? news : news.filter((n) => n.category === cat);
  const featured = shown[0];
  const rest = shown.slice(1);
  const pages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const current = Math.min(page, pages);
  const pageItems = rest.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // přepnutí kategorie vždy vrátí na první stránku
  const pickCat = (c) => { setCat(c); setPage(1); };

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '128px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>NOVINKY</span>
        </div>
        <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(48px,7vw,96px)', lineHeight: 1.12, textTransform: 'uppercase', color: '#121212', letterSpacing: '.5px', marginBottom: 36 }}>Ze života klubu</h1>

        {featured && (
          <Hov as={Link} href={`/novinky/${featured.id}`} className="fk-rev fk-zoom" style="border-radius:10px;overflow:hidden;position:relative;cursor:pointer;min-height:420px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
            <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: bg(featured, 0), backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 28%,rgba(10,10,11,.92))' }} />
            <div style={{ position: 'relative', padding: 42, maxWidth: 680 }}>
              {featured.category && <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 10 }}>{featured.category.toUpperCase()}</span>}
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4vw,54px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, marginTop: 18, letterSpacing: '.4px' }}>{featured.title}</div>
              <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 16, marginTop: 14, lineHeight: 1.55, maxWidth: 560 }}>{featured.text}</p>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, fontWeight: 600, marginTop: 16 }}>{featured.date}</div>
            </div>
          </Hov>
        )}
      </section>

      {/* FILTR KATEGORIÍ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 30 }}>
          {newsCategories.map((c) => {
            const active = cat === c;
            return (
              <span key={c} onClick={() => pickCat(c)} style={{ fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all .2s', ...(active ? { background: '#C1121F', color: '#fff' } : { background: '#fff', color: '#3a3f47', border: '1px solid #ECEEF1' }) }}>{c}</span>
            );
          })}
        </div>
      </section>

      {/* MŘÍŽKA NOVINEK */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 110px' }}>
        {rest.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {pageItems.map((n, i) => (
              <Hov key={n.id} as={Link} href={`/novinky/${n.id}`} className="fk-rev fk-zoom" style="background:#fff;border-radius:10px;overflow:hidden;cursor:pointer;display:block;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06);transition:transform .35s,box-shadow .35s" hover="transform:translateY(-8px);box-shadow:0 28px 56px rgba(18,18,18,.15)">
                <div className="fk-zi" style={{ height: 190, background: bg(n, i + 1), backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {n.category && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', color: '#C1121F' }}>{n.category.toUpperCase()}</span>}
                    <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginLeft: 'auto' }}>{n.date}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.25, color: '#1E1E1E' }}>{n.title}</div>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>{n.text}</p>
                </div>
              </Hov>
            ))}
          </div>
        ) : (
          !featured && <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', color: '#9AA1AC', fontWeight: 600 }}>V této kategorii zatím nejsou žádné novinky.</div>
        )}

        {/* STRÁNKOVÁNÍ */}
        {pages > 1 && (
          <nav aria-label="Stránkování novinek" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setPage(current - 1)} disabled={current === 1} style={pageBtn(false, current === 1)}>Novější</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} aria-current={p === current ? 'page' : undefined} style={pageBtn(p === current, false)}>{p}</button>
            ))}
            <button onClick={() => setPage(current + 1)} disabled={current === pages} style={pageBtn(false, current === pages)}>Starší</button>
          </nav>
        )}
      </section>
    </div>
  );
}

// styl tlačítka ve stránkování (aktivní / neaktivní / zakázané)
function pageBtn(active, disabled) {
  return {
    fontSize: 13,
    fontWeight: 700,
    padding: '10px 16px',
    borderRadius: 10,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all .2s',
    border: active ? '1px solid #C1121F' : '1px solid #ECEEF1',
    background: active ? '#C1121F' : '#fff',
    color: active ? '#fff' : '#3a3f47',
    opacity: disabled ? 0.45 : 1,
    fontFamily: 'inherit',
  };
}
