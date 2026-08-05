'use client';
// Detail jedné novinky — /novinky/<id>. Obsah bere ze store (useContent),
// takže se hned projeví úpravy z administrace.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hov } from '@/app/components/ui';
import { PH_ARR } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

const bg = (item, i) => (item && item.image ? `url(${item.image})` : PH_ARR[i % PH_ARR.length]);

export default function NovinkaDetail() {
  useRevealEngine();
  const params = useParams();
  const { news } = useContent();

  const id = decodeURIComponent(String(params?.id || ''));
  const index = news.findIndex((n) => n.id === id);
  const item = index >= 0 ? news[index] : null;

  if (!item) {
    return (
      <div style={{ background: '#F6F7F9', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '160px 28px 110px' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', maxWidth: 520, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: '#121212' }}>Novinka nenalezena</div>
          <p style={{ color: '#6B7280', fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>Článek byl nejspíš přejmenovaný nebo smazaný.</p>
          <Hov as={Link} href="/novinky" style="display:inline-block;margin-top:18px;background:#C1121F;color:#fff;font-weight:700;font-size:15px;padding:14px 26px;border-radius:10px;cursor:pointer" hover="background:#D62839;color:#fff">Zpět na novinky</Hov>
        </div>
      </div>
    );
  }

  const paragraphs = String(item.body || '').split('\n').map((p) => p.trim()).filter(Boolean);
  const others = news.filter((n) => n.id !== item.id).slice(0, 3);

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '128px 28px 0' }}>
        <Hov as={Link} href="/novinky" className="fk-rev" style="display:inline-block;font-size:13px;font-weight:700;color:#9AA1AC;margin-bottom:22px;cursor:pointer;transition:color .2s" hover="color:#C1121F">Zpět na novinky</Hov>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {item.category && <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 10 }}>{item.category.toUpperCase()}</span>}
          <span style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>{item.date}</span>
        </div>
        <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(40px,6vw,80px)', lineHeight: 1.1, textTransform: 'uppercase', color: '#121212', letterSpacing: '.5px' }}>{item.title}</h1>
      </section>

      {/* ============ FOTKA + TEXT ============ */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '32px 28px 0' }}>
        <div className="fk-rev" style={{ height: 380, borderRadius: 10, background: bg(item, Math.max(0, index)), backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 20px 50px rgba(18,18,18,.14)' }} />
        <article className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 40, marginTop: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06)' }}>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: '#1E1E1E', fontWeight: 500 }}>{item.text}</p>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: '#3a3f47', marginTop: 18 }}>{p}</p>
          ))}
        </article>
      </section>

      {/* ============ DALŠÍ NOVINKY ============ */}
      {others.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 28px 110px' }}>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>DALŠÍ NOVINKY</span>
          </div>
          <div className="fk-teams" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {others.map((n, i) => (
              <Hov key={n.id} as={Link} href={`/novinky/${n.id}`} className="fk-rev fk-zoom" style="background:#fff;border-radius:10px;overflow:hidden;cursor:pointer;display:block;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06);transition:transform .35s,box-shadow .35s" hover="transform:translateY(-8px);box-shadow:0 28px 56px rgba(18,18,18,.15)">
                <div className="fk-zi" style={{ height: 160, background: bg(n, i + 1), backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: 20 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', color: '#C1121F' }}>{(n.category || '').toUpperCase()}</span>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.28, marginTop: 6, color: '#1E1E1E' }}>{n.title}</div>
                  <div style={{ color: '#9AA1AC', fontSize: 12, fontWeight: 600, marginTop: 8 }}>{n.date}</div>
                </div>
              </Hov>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
