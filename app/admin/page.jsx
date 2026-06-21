'use client';
import Image from 'next/image';
import { Hov } from '@/app/components/ui';
import { COLORS } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { cmsStats, cmsRegistrations, cmsTodayMatches, cmsRentalRequests, playersTotal, coachesTotal } from '@/content/club';

const cardSh = '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)';

const cmsNav = [
  ['📊', 'Přehled', '', true],
  ['👥', 'Registrace', '5', false],
  ['🏟️', 'Pronájmy', '3', false],
  ['⚽', 'Zápasy', '', false],
  ['📰', 'Novinky', '', false],
  ['⚙️', 'Nastavení', '', false],
].map(([emoji, label, badge, active]) => ({ emoji, label, badge, active }));

const cmsActions = [
  { emoji: '➕', label: 'Přidat novinku' },
  { emoji: '📅', label: 'Naplánovat zápas' },
  { emoji: '👤', label: 'Nový člen' },
  { emoji: '📊', label: 'Export dat' },
];

function tagStyle(tg) {
  const base = { fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99 };
  if (tg === 'new') return { ...base, background: '#FBEAEC', color: '#C1121F' };
  if (tg === 'ok') return { ...base, background: '#EAF6EE', color: '#1F8A4C' };
  return { ...base, background: '#F4F5F7', color: '#9AA1AC' };
}

export default function Admin() {
  useRevealEngine();

  return (
    <div style={{ background: '#F6F7F9', minHeight: '100vh' }}>
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '104px 24px 60px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        {/* ============ SIDEBAR ============ */}
        <div className="fk-rev" style={{ position: 'sticky', top: 96, background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 16px', borderBottom: '1px solid #F2F3F5', marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #ECEEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <Image src="/logo.webp" alt="" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: '#121212', letterSpacing: '.3px' }}>FK KUNICE</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#9AA1AC' }}>ADMIN</div>
            </div>
          </div>
          {cmsNav.map((cn, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 3, ...(cn.active ? { background: '#FBEAEC', color: '#C1121F' } : { color: '#3a3f47' }) }}>
              <span>{cn.emoji}</span>
              <span>{cn.label}</span>
              {cn.badge && <span style={{ marginLeft: 'auto', background: '#C1121F', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>{cn.badge}</span>}
            </div>
          ))}
        </div>

        {/* ============ MAIN ============ */}
        <div>
          {/* info banner */}
          <div className="fk-rev" style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            Toto je živý náhled administrace. Reálná správa obsahu (týmy, hráči, novinky, rezervace) poběží přes napojený headless CMS — viz README.
          </div>

          {/* header */}
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#121212', letterSpacing: '.3px' }}>Přehled</div>
              <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Neděle 21. června 2026</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12, padding: '10px 14px' }}>
                <span style={{ color: '#9AA1AC' }}>⌕</span>
                <input placeholder="Hledat…" style={{ border: 'none', outline: 'none', background: 'none', fontFamily: 'Inter', fontSize: 13, width: 120 }} />
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>PD</div>
            </div>
          </div>

          {/* stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {cmsStats.map((cs, i) => (
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: cardSh }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA1AC', letterSpacing: '.5px' }}>{cs.label}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: '#121212', marginTop: 8, lineHeight: 1 }}>{cs.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: cs.up ? '#1F8A4C' : '#C1121F' }}>{cs.trend}</div>
              </div>
            ))}
          </div>

          {/* registrace + dnešní zápasy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: cardSh }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#121212' }}>Nové registrace</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#C1121F', cursor: 'pointer' }}>Zobrazit vše</span>
              </div>
              {cmsRegistrations.map((rg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 99, background: rg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{rg.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{rg.name}</div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{rg.team}</div>
                  </div>
                  <span style={tagStyle(rg.tg)}>{rg.tag}</span>
                </div>
              ))}
            </div>
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: cardSh }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#121212', marginBottom: 16 }}>Dnešní zápasy</div>
              {cmsTodayMatches.map((mt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F2F3F5' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1E1E' }}>{mt.match}</div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{mt.team}</div>
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: '#C1121F' }}>{mt.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* žádosti o pronájem + rychlé akce */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: cardSh }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#121212', marginBottom: 16 }}>Žádosti o pronájem</div>
              {cmsRentalRequests.map((rq, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{rq.who}</div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{rq.what}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: '#EAF6EE', color: '#1F8A4C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer' }}>✓</span>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: '#FBEAEC', color: '#C1121F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer' }}>✕</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: cardSh }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#121212', marginBottom: 16 }}>Rychlé akce</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {cmsActions.map((ca, i) => (
                  <Hov key={i} style="background:#F6F7F9;border-radius:13px;padding:16px 14px;cursor:pointer;transition:background .2s" hover="background:#FBEAEC">
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{ca.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1E1E' }}>{ca.label}</div>
                  </Hov>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
