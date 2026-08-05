'use client';
import { Fragment } from 'react';
import Link from 'next/link';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { Hov, Eyebrow, H2 } from './components/ui';
import { Icon } from './components/icons';
import { COLORS, PH, PH_ARR, photo, initials, wldBadge } from '@/lib/design';
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
  const { teams, homeStats, nextMatch, results, leagueTable, whyCards, camps, facilities, news, sponsors, gallery, homeTexts } = useContent();
  const T = homeTexts;
  const heroCtas = T.hero.ctas || [];
  const featured = news[0];
  const sideNews = news.slice(1, 4);
  const newsBg = (item, i) => (item && item.image ? `url(${item.image})` : PH_ARR[i % PH_ARR.length]);

  const teamCards = teams.map((t, i) => ({
    id: t.id, name: t.name, age: t.cat, league: t.comp.toUpperCase(),
    coach: t.coaches[0] ? t.coaches[0].n : 'Připravujeme',
    initials: t.coaches[0] ? initials(t.coaches[0].n) : 'FK',
    img: t.photo ? `url(${t.photo})` : PH_ARR[i % PH_ARR.length], coachBg: t.coaches[0] ? COLORS.red : '#2a2a2a',
  }));

  const table = leagueTable.slice(0, 4).map((t) => ({
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
      <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', background: '#050506' }}>
        {/* fotka hráče s "1934" — celá scéna, bez zoomu; vlevo plynule přechází do černé */}
        <div className="fk-hero-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/hero-1934.jpg)', backgroundSize: 'auto 82%', backgroundPosition: 'calc(100% + 40px) bottom', backgroundRepeat: 'no-repeat' }} />
        {/* živé efekty: pulzující reflektory, paprsky a vlnící se červený kouř */}
        <div className="fk-hero-fx" aria-hidden="true">
          <span className="fk-fx-smoke-a" />
          <span className="fk-fx-smoke-b" />
          <span className="fk-fx-rays" />
          <span className="fk-fx-lights" />
        </div>

        <div className="fk-hero-veil" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#050506 0%,#050506 24%,rgba(5,5,6,.8) 36%,rgba(5,5,6,.25) 47%,transparent 58%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#050506 0%,rgba(5,5,6,.65) 10%,transparent 26%,transparent 88%,#050506 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", color: '#fff', fontSize: 'clamp(64px,9.5vw,148px)', lineHeight: 0.95, letterSpacing: '.5px', textTransform: 'uppercase', textShadow: '0 4px 50px rgba(0,0,0,.55)', maxWidth: 720 }}>
            {T.hero.title}
          </h1>
          <div className="fk-rev" style={{ marginTop: 20, width: 'max-content', maxWidth: '90vw', position: 'relative', transform: 'rotate(-2.5deg)' }}>
            <span style={{ fontFamily: "'Caveat',cursive", fontWeight: 700, fontSize: 'clamp(40px,4.8vw,72px)', color: '#fff', lineHeight: .95, display: 'block', whiteSpace: 'nowrap', textShadow: '0 3px 28px rgba(0,0,0,.4)' }}>{T.hero.script}</span>
            <svg viewBox="0 0 400 26" preserveAspectRatio="none" style={{ position: 'absolute', left: 6, bottom: -14, width: '94%', height: 18, overflow: 'visible' }} fill="none"><path d="M5 16 C 90 5, 180 25, 268 11 S 378 5, 395 13" stroke="#D62839" strokeWidth={5} strokeLinecap="round" /></svg>
          </div>
          <p className="fk-rev" style={{ marginTop: 38, color: 'rgba(255,255,255,.72)', fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.65, maxWidth: 430 }}>
            {String(T.hero.perex || '').split('\n').map((line, i) => (
              <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
            ))}
          </p>
          <div className="fk-rev" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 38 }}>
            {heroCtas.map((cta, i) => (i === 0 ? (
              <Hov key={i} as={Link} href={cta.href || '/'} style="display:inline-flex;align-items:center;gap:10px;background:#E01B24;color:#fff;font-weight:700;font-size:13px;letter-spacing:1.1px;text-transform:uppercase;padding:13px 22px;border-radius:10px;cursor:pointer;box-shadow:0 10px 28px rgba(224,27,36,.4);transition:transform .25s,box-shadow .25s,background .25s" hover="transform:translateY(-2px);box-shadow:0 16px 38px rgba(224,27,36,.55);background:#F0242D;color:#fff">
                {cta.label}
                <span aria-hidden="true" style={{ fontSize: 15 }}>→</span>
              </Hov>
            ) : (
              <Hov key={i} as={Link} href={cta.href || '/'} style="display:inline-flex;align-items:center;background:rgba(8,8,10,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.28);color:#fff;font-weight:700;font-size:13px;letter-spacing:1.1px;text-transform:uppercase;padding:13px 22px;border-radius:10px;cursor:pointer;transition:background .25s,transform .25s,border-color .25s" hover="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.55);transform:translateY(-2px);color:#fff">{cta.label}</Hov>
            )))}
          </div>
        </div>

        <div style={{ position: 'absolute', zIndex: 3, bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, fontWeight: 700, letterSpacing: '2px' }}>{T.hero.scrollLabel}</span>
          <div style={{ width: 24, height: 40, border: '2px solid rgba(255,255,255,.45)', borderRadius: 99, display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
            <span style={{ width: 4, height: 8, background: '#fff', borderRadius: 99, animation: 'fkScroll 1.8s infinite' }} />
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section style={{ background: '#050506', padding: '38px 0' }}>
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
          <div><Eyebrow>{T.match.eyebrow}</Eyebrow><H2>{T.match.title}</H2></div>
          <Hov as={Link} href="/zapasy" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:10px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(18,18,18,.05),0 8px 24px rgba(18,18,18,.06);transition:transform .2s,box-shadow .2s" hover="transform:translateY(-2px);box-shadow:0 14px 34px rgba(18,18,18,.12)">{T.match.link}</Hov>
        </div>

        <div className="fk-match-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24 }}>
          {/* upcoming */}
          <div className="fk-rev" style={{ background: 'linear-gradient(155deg,#1c1c1e,#0d0d0f)', borderRadius: 10, padding: 32, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(18,18,18,.28)' }}>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: 99, background: 'radial-gradient(circle,rgba(193,18,31,.5),transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#D62839', animation: 'fkPulse 1.6s infinite' }} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.65)' }}>{T.match.nextLabel} · {nextMatch.when}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '30px 0 26px', position: 'relative' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 14px', borderRadius: 10, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 22, boxShadow: '0 8px 20px rgba(193,18,31,.4)' }}>{nextMatch.home.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: '.5px' }}>{nextMatch.home.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nextMatch.home.side}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 'none', padding: '0 14px' }}><div style={{ fontFamily: "'Bebas Neue'", fontSize: 38, color: 'rgba(255,255,255,.3)' }}>VS</div></div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 14px', borderRadius: 10, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 22 }}>{nextMatch.away.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 19, letterSpacing: '.5px' }}>{nextMatch.away.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nextMatch.away.side}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, position: 'relative', marginBottom: 22 }}>
              {cdBoxes.map((cb) => (
                <div key={cb.key} style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, lineHeight: 1, color: '#fff' }}><span data-cd={cb.key}>00</span></div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,.45)', marginTop: 5 }}>{cb.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
              <Hov as={Link} href="/zapasy" style="flex:1;text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;cursor:pointer;transition:transform .2s,background .2s;box-shadow:0 10px 24px rgba(193,18,31,.4)" hover="transform:translateY(-2px);background:#D62839;color:#fff">{T.match.detailLink}</Hov>
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}><Icon name="pin" size={15} /> {nextMatch.venue}</div>
            </div>
          </div>

          {/* results + table */}
          <div className="fk-rev" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)', flex: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 16 }}>{T.match.resultsTitle}</div>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ display: 'inline-flex', ...cssBadge(r.wld) }}>{r.wld}</span><span style={{ fontWeight: 600, fontSize: 14, color: '#1E1E1E' }}>{r.opp}</span></div>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 19, color: '#121212', letterSpacing: '1px' }}>{r.score}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 14 }}>{T.match.tableTitle}</div>
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
          <Eyebrow>{T.teams.eyebrow}</Eyebrow><H2>{T.teams.title}</H2>
        </div>
        <div className="fk-teams" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {teamCards.map((tm) => (
            <Hov key={tm.id} as={Link} href={`/tymy/${tm.id}`} className="fk-rev fk-zoom" style={`background:#fff;border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s;position:relative;display:block;${cardSh}`} hover="transform:translateY(-8px) scale(1.02);box-shadow:0 30px 60px rgba(18,18,18,.18)">
              <div className="fk-zi" style={{ height: 248, background: tm.img, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 35%,rgba(10,10,11,.78))' }} />
                <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, textTransform: 'uppercase', letterSpacing: '.5px', color: '#fff', lineHeight: .9 }}>{tm.name}</div>
                    <div style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{tm.age}</div>
                  </div>
                  <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 10, letterSpacing: '.8px', padding: '6px 11px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tm.league}</span>
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
            <Eyebrow center dark>{T.why.eyebrow}</Eyebrow>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(44px,5.6vw,76px)', lineHeight: 1.12, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px' }}>{T.why.title}</h2>
          </div>
          <div className="fk-why" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {whyCards.map((w, i) => (
              <Hov key={i} className="fk-rev" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:30px;transition:background .3s,transform .3s,border-color .3s" hover="background:rgba(255,255,255,.07);transform:translateY(-6px);border-color:rgba(214,40,57,.4)">
                <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(214,40,57,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}><WhyIcon k={w.icon} /></div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '.4px' }}>{w.title}</div>
                <p style={{ color: 'rgba(255,255,255,.58)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>{w.text}</p>
              </Hov>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CAMPS ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '110px 28px' }}>
        <div className="fk-rev" style={{ marginBottom: 44 }}><Eyebrow>{T.camps.eyebrow}</Eyebrow><H2>{T.camps.title}</H2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {camps.filter((c) => !c.archived).map((c, i) => (
            <Hov key={c.id || i} as={Link} href="/kempy" className="fk-rev fk-zoom" style="border-radius:10px;overflow:hidden;position:relative;cursor:pointer;min-height:340px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
              <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: photo(c.img), backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,rgba(10,10,11,.88) 0%,rgba(10,10,11,.5) 45%,rgba(10,10,11,.05) 100%)' }} />
              <div style={{ position: 'relative', padding: 44, maxWidth: 580 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '8px 15px', borderRadius: 10, marginBottom: 18 }}>{c.tag}</span>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4vw,50px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '.5px' }}>{c.title}</div>
                <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, marginTop: 14, lineHeight: 1.55 }}>{c.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
                  <Hov style="background:#C1121F;color:#fff;font-weight:700;font-size:15px;padding:15px 28px;border-radius:10px;box-shadow:0 12px 30px rgba(193,18,31,.5);transition:transform .2s,background .2s" hover="transform:translateY(-2px);background:#D62839;color:#fff">{T.camps.ctaLabel}</Hov>
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
            <div><Eyebrow>{T.rental.eyebrow}</Eyebrow><H2>{T.rental.title}</H2></div>
            <Hov as={Link} href="/pronajem" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:10px;cursor:pointer;background:#F6F7F9;transition:transform .2s,background .2s" hover="background:#EEF0F3;transform:translateY(-2px)">{T.rental.link}</Hov>
          </div>
          <div className="fk-teams" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {facilities.map((f, i) => {
              const free = f.status === 'VOLNO';
              return (
                <Hov key={i} as={Link} href="/pronajem" className="fk-rev fk-zoom" style={`background:#fff;border-radius:10px;overflow:hidden;cursor:pointer;display:block;${cardSh};transition:transform .35s,box-shadow .35s`} hover="transform:translateY(-8px);box-shadow:0 30px 60px rgba(18,18,18,.16)">
                  <div className="fk-zi" style={{ height: 200, background: photo(f.img), backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 14, left: 14, background: free ? '#EAF6EE' : '#FBEAEC', color: free ? '#1F8A4C' : '#C1121F', fontWeight: 800, fontSize: 11, letterSpacing: '.5px', padding: '6px 12px', borderRadius: 10 }}>{f.status}</span>
                  </div>
                  <div style={{ padding: 24 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, textTransform: 'uppercase', letterSpacing: '.4px', color: '#121212' }}>{f.name}</div>
                    <div style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600, marginTop: 5 }}>{f.spec}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 18, paddingTop: 16, borderTop: '1px solid #F2F3F5' }}>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 27, color: '#C1121F', letterSpacing: '.5px' }}>{f.price}</span>
                      <span style={{ color: '#9AA1AC', fontSize: 13, fontWeight: 600 }}>{T.rental.unit}</span>
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
          <div><Eyebrow>{T.news.eyebrow}</Eyebrow><H2>{T.news.title}</H2></div>
          <Hov as={Link} href="/novinky" style="font-weight:700;font-size:15px;color:#121212;padding:14px 24px;border-radius:10px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(18,18,18,.05),0 8px 24px rgba(18,18,18,.06);transition:transform .2s,box-shadow .2s" hover="transform:translateY(-2px);box-shadow:0 14px 34px rgba(18,18,18,.12)">{T.news.link}</Hov>
        </div>
        <div className="fk-news-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {featured && (
            <Hov as={Link} href={`/novinky/${featured.id}`} className="fk-rev fk-zoom" style="border-radius:10px;overflow:hidden;position:relative;cursor:pointer;min-height:460px;display:flex;align-items:flex-end;box-shadow:0 20px 50px rgba(18,18,18,.14)">
              <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: newsBg(featured, 0), backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 28%,rgba(10,10,11,.92))' }} />
              <div style={{ position: 'relative', padding: 38 }}>
                {featured.category && <span style={{ background: '#C1121F', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 10 }}>{featured.category.toUpperCase()}</span>}
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(30px,3.6vw,46px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.02, marginTop: 18, maxWidth: 580, letterSpacing: '.4px' }}>{featured.title}</div>
                <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 15, lineHeight: 1.55, marginTop: 12, maxWidth: 520 }}>{featured.text}</p>
                <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600, marginTop: 14 }}>{featured.date}</div>
              </div>
            </Hov>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {sideNews.map((n, i) => (
              <Hov key={n.id || i} as={Link} href={`/novinky/${n.id}`} className="fk-rev" style="background:#fff;border-radius:10px;padding:16px;display:flex;gap:16px;cursor:pointer;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05);transition:transform .25s,box-shadow .25s" hover="transform:translateX(5px);box-shadow:0 16px 34px rgba(18,18,18,.1)">
                <div style={{ width: 100, height: 100, borderRadius: 10, flex: 'none', background: newsBg(n, i + 1), backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', color: '#C1121F' }}>{(n.category || '').toUpperCase()}</span>
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
        <div className="fk-rev" style={{ marginBottom: 38 }}><Eyebrow>{T.gallery.eyebrow}</Eyebrow><H2>{T.gallery.title}</H2></div>
        <div className="fk-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 172, gap: 14 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const cells = ['grid-column:span 2;grid-row:span 2', '', '', 'grid-column:span 2', '', '', 'grid-column:span 2', ''];
            const fallback = [PH.dusk, PH.sunset, PH.slate, PH.cool, PH.warm, PH.char, PH.red, PH.ember];
            // fotka z administrace; bez ní zůstane barevný přechod
            const item = gallery[i];
            const bg = item && item.image ? `url(${item.image})` : fallback[i];
            return (
              <Hov key={i} className="fk-rev fk-zoom" style={`${cells[i]};border-radius:10px;overflow:hidden;cursor:pointer;position:relative`}>
                <div className="fk-zi" role="img" aria-label={(item && item.alt) || ''} style={{ position: 'absolute', inset: 0, background: bg, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <Hov style="position:absolute;inset:0;background:rgba(193,18,31,0);transition:background .3s" hover="background:rgba(193,18,31,.28)" />
              </Hov>
            );
          })}
        </div>
      </section>

      {/* ============ SPONSORS ============ */}
      <section style={{ background: '#fff', borderTop: '1px solid #ECEEF1', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev" style={{ textAlign: 'center', marginBottom: 40 }}><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#9AA1AC' }}>{T.sponsors.title}</div></div>
          <div className="fk-sponsors" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {sponsors.map((sp, i) => {
              const box = 'background:#fff;border:1px solid #ECEEF1;border-radius:10px;height:96px;display:flex;align-items:center;justify-content:center;padding:14px;cursor:pointer;transition:transform .3s,box-shadow .3s,border-color .3s;color:#B7BCC4';
              const lift = 'transform:translateY(-5px);box-shadow:0 18px 40px rgba(18,18,18,.1);border-color:#fff;color:#C1121F';
              const inner = sp.logo
                ? <img src={sp.logo} alt={sp.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <span style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: '1px', transition: 'color .3s' }}>{sp.name}</span>;
              // partner s vyplněnou adresou je odkaz, ostatní jen dlaždice
              return sp.url
                ? <Hov key={sp.id || i} as="a" href={sp.url} target="_blank" rel="noopener noreferrer" className="fk-rev" style={box} hover={lift}>{inner}</Hov>
                : <Hov key={sp.id || i} className="fk-rev" style={box} hover={lift}>{inner}</Hov>;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// helper: badge styl pro výsledek jako React objekt
function cssBadge(t) {
  const map = { V: { background: '#C1121F', color: '#fff' }, R: { background: '#EFF1F4', color: '#9AA1AC' }, P: { background: '#F3F0E9', color: '#A98C4E' } };
  return { width: 24, height: 24, borderRadius: 10, alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, fontFamily: 'Inter', ...(map[t] || map.V) };
}
function styleObj(str) {
  const out = {};
  for (const part of str.split(';')) { const i = part.indexOf(':'); if (i < 0) continue; const p = part.slice(0, i).trim(); const v = part.slice(i + 1).trim(); if (!p) continue; out[p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; }
  return out;
}
