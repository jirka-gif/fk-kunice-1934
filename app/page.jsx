'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { Hov, Eyebrow, H2 } from './components/ui';
import { COLORS, PH, PH_ARR, HERO_BGS, photo, initials, wldBadge } from '@/lib/design';
import { useContent } from '@/lib/store';

const cardSh = 'box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 26px rgba(18,18,18,.06)';

function WhyIcon({ k }) {
  const p = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: COLORS.redBright, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (k === 'star') return <svg {...p}><path d="M12 2l3 6 6 .9-4.5 4.3L18 20l-6-3.2L6 20l1.5-6.8L3 8.9 9 8z" /></svg>;
  if (k === 'home') return <svg {...p}><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" /></svg>;
  if (k === 'users') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  return <svg {...p}><circle cx={12} cy={12} r={10} /><path d="M12 2a10 10 0 0 0 0 20M2 12h20" /></svg>;
}

export default function Home() {
  useRevealEngine();
  const { teams, homeStats, nextMatch, results, leagueTable, whyCards, camps, facilities, homeNews, sponsors } = useContent();
  const [heroVariant, setHeroVariant] = useState(0);

  const teamCards = teams.map((t, i) => ({
    id: t.id, name: t.name, age: t.cat, league: t.comp.toUpperCase(),
    coach: t.coaches[0] ? t.coaches[0].n : 'Připravujeme',
    initials: t.coaches[0] ? initials(t.coaches[0].n) : 'FK',
    img: PH_ARR[i % PH_ARR.length], coachBg: t.coaches[0] ? COLORS.red : '#2a2a2a',
  }));

  const table = leagueTable.map((t) => ({
    ...t,
    posColor: t.me ? COLORS.red : (t.pos <= 3 ? COLORS.text : '#B7BCC4'),
    weight: t.me ? 800 : 600,
    ptsColor: t.me ? COLORS.red : COLORS.ink,
    row: `display:flex;align-items:center;gap:10px;padding:10px ${t.me ? '12px' : '0'};border-radius:${t.me ? '12px' : '0'};${t.me ? 'background:#FBEAEC;margin:2px -8px' : 'border-bottom:1px solid #F2F3F5'}`,
  }));

  const cdBoxes = [{ key: 'd', label: 'DNÍ' }, { key: 'h', label: 'HODIN' }, { key: 'm', label: 'MINUT' }, { key: 's', label: 'SEKUND' }];

  return (
    <div>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', background: '#121212' }}>
        <div data-parallax style={{ position: 'absolute', inset: '-8% 0 0 0', height: '118%', background: HERO_BGS[heroVariant], backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,10,11,.5) 0%,rgba(10,10,11,.28) 40%,rgba(10,10,11,.86) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 12% 105%,rgba(193,18,31,.42),transparent 58%)' }} />

        {/* jemná plovoucí silueta loga vpravo */}
        <div aria-hidden="true" style={{ position: 'absolute', zIndex: 1, right: '-7%', top: '11%', transform: 'translateY(-50%)', width: 'clamp(440px,48vw,760px)', height: 'clamp(440px,48vw,760px)', opacity: 0.11, filter: 'blur(1.5px)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%,#000 40%,transparent 66%)', maskImage: 'radial-gradient(circle at 50% 50%,#000 40%,transparent 66%)', pointerEvents: 'none', animation: 'fkFloat 7s ease-in-out infinite' }}>
          <img src="/logo.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", color: '#fff', fontSize: 'clamp(66px,11vw,168px)', lineHeight: 1.22, letterSpacing: '.5px', textTransform: 'uppercase', textShadow: '0 4px 50px rgba(0,0,0,.45)', maxWidth: 1050 }}>FK Kunice<br /><span>1934</span></h1>
          <div className="fk-rev" style={{ marginTop: 24, width: 'max-content', maxWidth: '90vw', position: 'relative', transform: 'rotate(-3.5deg)' }}>
            <span style={{ fontFamily: "'Caveat',cursive", fontWeight: 700, fontSize: 'clamp(42px,5.4vw,82px)', color: '#fff', lineHeight: .95, display: 'block', whiteSpace: 'nowrap', textShadow: '0 3px 28px rgba(0,0,0,.4)' }}>Společně silnější.</span>
            <svg viewBox="0 0 400 26" preserveAspectRatio="none" style={{ position: 'absolute', left: 6, bottom: -14, width: '94%', height: 18, overflow: 'visible' }} fill="none"><path d="M5 16 C 90 5, 180 25, 268 11 S 378 5, 395 13" stroke="#D62839" strokeWidth={5} strokeLinecap="round" /></svg>
          </div>
          <div className="fk-rev" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 40 }}>
            <Hov as={Link} href="/kontakt" style="display:inline-flex;align-items:center;gap:10px;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:17px 30px;border-radius:16px;cursor:pointer;box-shadow:0 14px 38px rgba(193,18,31,.5);transition:transform .25s,box-shadow .25s,background .25s" hover="transform:translateY(-3px);box-shadow:0 20px 50px rgba(214,40,57,.6);background:#D62839;color:#fff">Přidej se do klubu →</Hov>
            <Hov as={Link} href="/kempy" style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,.45);color:#fff;font-weight:700;font-size:16px;padding:17px 30px;border-radius:16px;cursor:pointer;transition:background .25s,transform .25s" hover="background:rgba(255,255,255,.2);transform:translateY(-3px);color:#fff">Letní kempy</Hov>
            <Hov as={Link} href="/zapasy" style="display:inline-flex;align-items:center;gap:10px;color:#fff;font-weight:700;font-size:16px;padding:17px 22px;border-radius:16px;cursor:pointer;transition:background .25s" hover="background:rgba(255,255,255,.1);color:#fff">Zápasy</Hov>
          </div>
        </div>

        <div style={{ position: 'absolute', zIndex: 3, bottom: 30, right: 28, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(10,10,11,.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.14)', padding: '7px 10px', borderRadius: 14 }}>
          <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 10, fontWeight: 700, letterSpacing: '1px', padding: '0 4px' }}>HERO</span>
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => setHeroVariant(i)} style={{ width: 24, height: 24, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'Inter', transition: 'all .2s', ...(heroVariant === i ? { background: '#C1121F', color: '#fff' } : { background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)' }) }}>{i + 1}</button>
          ))}
        </div>

        <div style={{ position: 'absolute', zIndex: 3, bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, fontWeight: 700, letterSpacing: '2px' }}>SCROLL</span>
          <div style={{ width: 24, height: 40, border: '2px solid rgba(255,255,255,.45)', borderRadius: 99, display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
            <span style={{ width: 4, height: 8, background: '#fff', borderRadius: 99, animation: 'fkScroll 1.8s infinite' }} />
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section style={{ background: '#121212', padding: '38px 0' }}>
        <div className="fk-stats" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {homeStats.map((s, i) => (
            <div key={i} className="fk-rev" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue'", color: '#fff', fontSize: 'clamp(40px,4.4vw,62px)', lineHeight: 1 }}><span data-count={s.value}>0</span><span style={{ color: '#D62839' }}>{s.suffix}</span></div>
              <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', marginTop: 6, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MATCH CENTER ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 28px 56px' }}>
        <div className="fk-rev fk-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 44, flexWrap: 'wrap' }}>
          <div><Eyebrow>MATCH CENTER</Eyebrow><H2>Žijeme každým zápasem</H2></div>
          <Hov as={Link} href="/zapasy" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:14px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(18,18,18,.05),0 8px 24px rgba(18,18,18,.06);transition:transform .2s,box-shadow .2s" hover="transform:translateY(-2px);box-shadow:0 14px 34px rgba(18,18,18,.12)">Všechny zápasy →</Hov>
        </div>

        <div className="fk-match-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24 }}>
          {/* upcoming */}
          <div className="fk-rev" style={{ background: 'linear-gradient(155deg,#1c1c1e,#0d0d0f)', borderRadius: 24, padding: 32, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(18,18,18,.28)' }}>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: 99, background: 'radial-gradient(circle,rgba(193,18,31,.5),transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#D62839', animation: 'fkPulse 1.6s infinite' }} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.65)' }}>PŘÍŠTÍ ZÁPAS · {nextMatch.when}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '30px 0 26px', position: 'relative' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 14px', borderRadius: 18, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 22, boxShadow: '0 8px 20px rgba(193,18,31,.4)' }}>{nextMatch.home.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: '.5px' }}>{nextMatch.home.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nextMatch.home.side}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 'none', padding: '0 14px' }}><div style={{ fontFamily: "'Bebas Neue'", fontSize: 38, color: 'rgba(255,255,255,.3)' }}>VS</div></div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 14px', borderRadius: 18, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 22 }}>{nextMatch.away.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: '.5px' }}>{nextMatch.away.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nextMatch.away.side}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, position: 'relative', marginBottom: 22 }}>
              {cdBoxes.map((cb) => (
                <div key={cb.key} style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 13, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, lineHeight: 1, color: '#fff' }}><span data-cd={cb.key}>00</span></div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,.45)', marginTop: 5 }}>{cb.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
              <Hov as={Link} href="/zapasy" style="flex:1;text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:14px;cursor:pointer;transition:transform .2s,background .2s;box-shadow:0 10px 24px rgba(193,18,31,.4)" hover="transform:translateY(-2px);background:#D62839;color:#fff">Detail zápasu</Hov>
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', padding: '0 16px', borderRadius: 14, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>📍 {nextMatch.venue}</div>
            </div>
          </div>

          {/* results + table */}
          <div className="fk-rev" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#fff', borderRadius: 22, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)', flex: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 16 }}>POSLEDNÍ VÝSLEDKY</div>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ display: 'inline-flex', ...cssBadge(r.wld) }}>{r.wld}</span><span style={{ fontWeight: 600, fontSize: 14, color: '#1E1E1E' }}>{r.opp}</span></div>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 19, color: '#121212', letterSpacing: '1px' }}>{r.score}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 22, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 14 }}>TABULKA · III. TŘÍDA</div>
              {table.map((t, i) => (
                <div key={i} style={styleObj(t.row)}>
                  <span style={{ fontFamily: "'Bebas Neue'", width: 22, color: t.posColor, fontSize: 16 }}>{t.pos}</span>
                  <span style={{ flex: 1, fontWeight: t.weight, fontSize: 14, color: '#1E1E1E' }}>{t.team}</span>
                  <span style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, width: 40, textAlign: 'center' }}>{t.gp}</span>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 17, width: 30, textAlign: 'right', color: t.ptsColor }}>{t.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TEAMS ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px 110px' }}>
        <div className="fk-rev" style={{ marginBottom: 44 }}>
          <Eyebrow>NAŠE TÝMY</Eyebrow><H2>Od přípravky po dospělé</H2>
        </div>
        <div className="fk-teams" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {teamCards.map((tm) => (
            <Hov key={tm.id} as={Link} href={`/tymy/${tm.id}`} className="fk-rev fk-zoom" style={`background:#fff;border-radius:20px;overflow:hidden;cursor:pointer;transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s;position:relative;display:block;${cardSh}`} hover="transform:translateY(-8px) scale(1.02);box-shadow:0 30px 60px rgba(18,18,18,.18)">
              <div className="fk-zi" style={{ height: 248, background: tm.img, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(10,10,11,.78))' }} />
                <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, textTransform: 'uppercase', letterSpacing: '.5px', color: '#fff', lineHeight: .9 }}>{tm.name}</div>
                    <div style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{tm.age}</div>
                  </div>
                  <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 10, letterSpacing: '.8px', padding: '6px 11px', borderRadius: 99, whiteSpace: 'nowrap' }}>{tm.league}</span>
                </div>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 99, background: tm.coachBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Inter' }}>{tm.initials}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E' }}>{tm.coach}</div><div style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 600 }}>Hlavní trenér</div></div>
                <span style={{ color: '#C1121F', fontWeight: 800, fontSize: 18 }}>→</span>
              </div>
            </Hov>
          ))}
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section style={{ background: '#121212', padding: '110px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 85% 0%,rgba(193,18,31,.22),transparent 58%)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
          <div className="fk-rev" style={{ textAlign: 'center', marginBottom: 60 }}>
            <Eyebrow center dark>PROČ RODIČE VOLÍ NÁS</Eyebrow>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(44px,5.6vw,76px)', lineHeight: 1.12, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px' }}>Víc než jen fotbal</h2>
          </div>
          <div className="fk-why" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {whyCards.map((w, i) => (
              <Hov key={i} className="fk-rev" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:30px;transition:background .3s,transform .3s,border-color .3s" hover="background:rgba(255,255,255,.07);transform:translateY(-6px);border-color:rgba(214,40,57,.4)">
                <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(214,40,57,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}><WhyIcon k={w.icon} /></div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '.4px' }}>{w.title}</div>
                <p style={{ color: 'rgba(255,255,255,.58)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>{w.text}</p>
              </Hov>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CAMPS ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '110px 28px' }}>
        <div className="fk-rev" style={{ marginBottom: 44 }}><Eyebrow>LETNÍ KEMPY</Eyebrow><H2>Léto plné fotbalu</H2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {camps.map((c, i) => (
            <Hov key={i} as={Link} href="/kempy" className="fk-rev fk-zoom" style="border-radius:24px;overflow:hidden;position:relative;cursor:pointer;min-height:340px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
              <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: photo(c.img), backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,rgba(10,10,11,.88) 0%,rgba(10,10,11,.5) 45%,rgba(10,10,11,.05) 100%)' }} />
              <div style={{ position: 'relative', padding: 44, maxWidth: 580 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '8px 15px', borderRadius: 99, marginBottom: 18 }}>{c.tag}</span>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4vw,50px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '.5px' }}>{c.title}</div>
                <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, marginTop: 14, lineHeight: 1.55 }}>{c.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
                  <Hov style="background:#C1121F;color:#fff;font-weight:700;font-size:15px;padding:15px 28px;border-radius:16px;box-shadow:0 12px 30px rgba(193,18,31,.5);transition:transform .2s,background .2s" hover="transform:translateY(-2px);background:#D62839;color:#fff">Registrovat →</Hov>
                  <div style={{ color: '#fff' }}><span style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '.5px' }}>{c.price}</span> <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 600 }}>/ {c.term}</span></div>
                </div>
              </div>
            </Hov>
          ))}
        </div>
      </section>

      {/* ============ RENTAL ============ */}
      <section style={{ background: '#fff', padding: '110px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev fk-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 44, flexWrap: 'wrap' }}>
            <div><Eyebrow>PRONÁJEM</Eyebrow><H2>Pronajmi si náš areál</H2></div>
            <Hov as={Link} href="/pronajem" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:14px;cursor:pointer;background:#F6F7F9;transition:transform .2s,background .2s" hover="background:#EEF0F3;transform:translateY(-2px)">Rezervovat →</Hov>
          </div>
          <div className="fk-teams" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {facilities.map((f, i) => {
              const free = f.status === 'VOLNO';
              return (
                <Hov key={i} as={Link} href="/pronajem" className="fk-rev fk-zoom" style={`background:#fff;border-radius:20px;overflow:hidden;cursor:pointer;display:block;${cardSh};transition:transform .35s,box-shadow .35s`} hover="transform:translateY(-8px);box-shadow:0 30px 60px rgba(18,18,18,.16)">
                  <div className="fk-zi" style={{ height: 200, background: photo(f.img), backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 14, left: 14, background: free ? '#EAF6EE' : '#FBEAEC', color: free ? '#1F8A4C' : '#C1121F', fontWeight: 800, fontSize: 11, letterSpacing: '.5px', padding: '6px 12px', borderRadius: 99 }}>{f.status}</span>
                  </div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, textTransform: 'uppercase', letterSpacing: '.4px', color: '#121212' }}>{f.name}</div>
                    <div style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600, marginTop: 5 }}>{f.spec}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 18, paddingTop: 16, borderTop: '1px solid #F2F3F5' }}>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 27, color: '#C1121F', letterSpacing: '.5px' }}>{f.price}</span>
                      <span style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600 }}>/ hodina</span>
                    </div>
                  </div>
                </Hov>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ NEWS ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '110px 28px' }}>
        <div className="fk-rev fk-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 44, flexWrap: 'wrap' }}>
          <div><Eyebrow>NOVINKY</Eyebrow><H2>Ze života klubu</H2></div>
          <Hov as={Link} href="/novinky" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:14px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(18,18,18,.05),0 8px 24px rgba(18,18,18,.06);transition:transform .2s,box-shadow .2s" hover="transform:translateY(-2px);box-shadow:0 14px 34px rgba(18,18,18,.12)">Magazín →</Hov>
        </div>
        <div className="fk-news-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          <Hov as={Link} href="/novinky" className="fk-rev fk-zoom" style="border-radius:24px;overflow:hidden;position:relative;cursor:pointer;min-height:460px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
            <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: PH.red, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 28%,rgba(10,10,11,.92))' }} />
            <div style={{ position: 'relative', padding: 38 }}>
              <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 99 }}>REPORTÁŽ</span>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(30px,3.6vw,46px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, marginTop: 18, maxWidth: 580, letterSpacing: '.4px' }}>Áčko slaví postup do okresního přeboru</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600 }}><span>Jan Novák</span><span>·</span><span>14. června 2026</span></div>
            </div>
          </Hov>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {homeNews.map((n, i) => (
              <Hov key={i} as={Link} href="/novinky" className="fk-rev" style="background:#fff;border-radius:18px;padding:16px;display:flex;gap:16px;cursor:pointer;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05);transition:transform .25s,box-shadow .25s" hover="transform:translateX(5px);box-shadow:0 16px 34px rgba(18,18,18,.1)">
                <div style={{ width: 100, height: 100, borderRadius: 14, flex: 'none', background: photo(n.img), backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', color: '#C1121F' }}>{n.tag}</span>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.28, marginTop: 6, color: '#1E1E1E' }}>{n.title}</div>
                  <div style={{ color: '#9AA1AC', fontSize: 12, fontWeight: 600, marginTop: 8 }}>{n.date}</div>
                </div>
              </Hov>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 28px 110px' }}>
        <div className="fk-rev" style={{ marginBottom: 38 }}><Eyebrow>GALERIE</Eyebrow><H2>Momenty</H2></div>
        <div className="fk-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 172, gap: 14 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const cells = ['grid-column:span 2;grid-row:span 2', '', '', 'grid-column:span 2', '', '', 'grid-column:span 2', ''];
            const imgs = [PH.dusk, PH.sunset, PH.slate, PH.cool, PH.warm, PH.char, PH.red, PH.ember];
            return (
              <Hov key={i} className="fk-rev fk-zoom" style={`${cells[i]};border-radius:16px;overflow:hidden;cursor:pointer;position:relative`}>
                <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: imgs[i], backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <Hov style="position:absolute;inset:0;background:rgba(193,18,31,0);transition:background .3s" hover="background:rgba(193,18,31,.28)" />
              </Hov>
            );
          })}
        </div>
      </section>

      {/* ============ SPONSORS ============ */}
      <section style={{ background: '#fff', borderTop: '1px solid #ECEEF1', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev" style={{ textAlign: 'center', marginBottom: 40 }}><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#9AA1AC' }}>PARTNEŘI KLUBU</div></div>
          <div className="fk-sponsors" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {sponsors.map((sp, i) => (
              <Hov key={i} className="fk-rev" style="background:#fff;border:1px solid #ECEEF1;border-radius:18px;height:96px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .3s,box-shadow .3s,border-color .3s;color:#B7BCC4" hover="transform:translateY(-5px);box-shadow:0 18px 40px rgba(18,18,18,.1);border-color:#fff;color:#C1121F">
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: '1px', transition: 'color .3s' }}>{sp}</span>
              </Hov>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// helper: badge styl pro výsledek jako React objekt
function cssBadge(t) {
  const map = { V: { background: '#C1121F', color: '#fff' }, R: { background: '#EFF1F4', color: '#9AA1AC' }, P: { background: '#F3F0E9', color: '#A98C4E' } };
  return { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, fontFamily: 'Inter', ...(map[t] || map.V) };
}
function styleObj(str) {
  const out = {};
  for (const part of str.split(';')) { const i = part.indexOf(':'); if (i < 0) continue; const p = part.slice(0, i).trim(); const v = part.slice(i + 1).trim(); if (!p) continue; out[p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; }
  return out;
}
