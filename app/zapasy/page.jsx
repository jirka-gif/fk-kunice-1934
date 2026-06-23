'use client';
import { useState } from 'react';
import { Hov, Eyebrow } from '@/app/components/ui';
import { Icon } from '@/app/components/icons';
import { Countdown } from '@/app/components/Countdown';
import { COLORS, PH } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

function evIcon(type) {
  if (type === 'goal') return 'width:22px;height:22px;border-radius:99px;background:#C1121F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex:none';
  if (type === 'yellow') return 'width:13px;height:17px;border-radius:3px;background:#F2C200;flex:none';
  return 'width:13px;height:17px;border-radius:3px;background:#C1121F;flex:none';
}
function styleObj(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split(';')) { const i = part.indexOf(':'); if (i < 0) continue; const p = part.slice(0, i).trim(); const v = part.slice(i + 1).trim(); if (!p) continue; out[p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; }
  return out;
}
function resultPill(r) {
  if (r === 'PROHRA') return { background: 'rgba(193,18,31,.16)', color: '#E0566A' };
  if (r === 'REMÍZA') return { background: 'rgba(255,255,255,.14)', color: 'rgba(255,255,255,.85)' };
  return { background: 'rgba(31,138,76,.18)', color: '#39C46E' };
}
const card = { background: '#fff', borderRadius: 22, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' };
const placeholder = (txt) => (
  <div className="fk-rev" style={{ ...card, padding: 32, textAlign: 'center', color: '#9AA1AC', fontSize: 14, fontWeight: 600 }}>{txt}</div>
);

export default function Zapasy() {
  useRevealEngine();
  const { teams } = useContent();
  const matchTeams = teams.filter((t) => t.id !== 'skolicka');
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, matchTeams.length - 1);
  const t = matchTeams[idx] || matchTeams[0];
  const isA = t.id === 'muziA';

  const nm = t.nextMatch || {};
  const nmHome = nm.home || {}; const nmAway = nm.away || {};
  const lm = t.lastMatch || {};
  const md = t.matchDetail || {};
  const mdHome = md.home || {}; const mdAway = md.away || {}; const mdScore = md.score || {};
  const table = t.table || [];

  const hasNext = !!(nm.when && nm.when.trim());
  const hasLastSummary = !!(lm.opp && lm.opp.trim());
  const hasDetail = isA && md.events && md.events.length > 0;

  const galleryCells = ['grid-column:span 2;grid-row:span 2', '', '', 'grid-column:span 2', '', '', 'grid-column:span 2', ''];
  const galleryImgs = [PH.dusk, PH.sunset, PH.slate, PH.cool, PH.warm, PH.char, PH.red, PH.ember];

  return (
    <div style={{ background: COLORS.bg }}>
      {/* ============ HERO + PŘEPÍNAČ ============ */}
      <section style={{ position: 'relative', padding: '128px 0 56px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#1c1c1e,#0d0d0f)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 80% 0%,rgba(193,18,31,.28),transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev"><Eyebrow dark>ZÁPASY</Eyebrow></div>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(48px,7vw,92px)', lineHeight: 1.12, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px' }}>{t.name}</h1>
          <p className="fk-rev" style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, marginTop: 12, maxWidth: 560, lineHeight: 1.55 }}>Výsledkový servis, příští zápas s odpočtem a aktuální tabulka týmu {t.name}.</p>
          <div className="fk-rev" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 26 }}>
            {matchTeams.map((tm, i) => {
              const active = i === idx;
              return (
                <span key={tm.id} onClick={() => setSel(i)} style={{ fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 99, cursor: 'pointer', transition: 'all .2s', ...(active ? { background: '#C1121F', color: '#fff' } : { background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.2)' }) }}>{tm.name}</span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ POSLEDNÍ ZÁPAS (výsledkový servis) ============ */}
      {isA && hasDetail ? (
        <>
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 28px 0' }}>
            <div className="fk-rev" style={{ marginBottom: 22 }}><Eyebrow>POSLEDNÍ ZÁPAS</Eyebrow></div>
            <div className="fk-rev" style={{ background: 'linear-gradient(150deg,#1c1c1e,#0d0d0f)', borderRadius: 24, padding: 'clamp(28px,4vw,48px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 50% 120%,rgba(193,18,31,.4),transparent 60%)' }} />
              {(md.header || md.when) && <div style={{ position: 'relative', textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 6 }}>{md.header}</div>}
              {md.when && <div style={{ position: 'relative', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: 13, fontWeight: 600, marginBottom: 26 }}>{md.when}</div>}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(20px,5vw,56px)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 'clamp(64px,8vw,96px)', height: 'clamp(64px,8vw,96px)', margin: '0 auto 14px', borderRadius: 20, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,3vw,36px)', color: '#fff' }}>{mdHome.short}</div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(18px,2.2vw,26px)', color: '#fff' }}>{mdHome.name}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(56px,10vw,104px)', color: '#fff', lineHeight: 1 }}>{mdScore.home}<span style={{ color: 'rgba(255,255,255,.35)', margin: '0 8px' }}>:</span>{mdScore.away}</div>
                  <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 800, letterSpacing: '1px', padding: '5px 12px', borderRadius: 99, ...resultPill(md.result) }}>{md.result}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 'clamp(64px,8vw,96px)', height: 'clamp(64px,8vw,96px)', margin: '0 auto 14px', borderRadius: 20, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,3vw,36px)', color: '#fff' }}>{mdAway.short}</div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(18px,2.2vw,26px)', color: '#fff' }}>{mdAway.name}</div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ maxWidth: 1000, margin: '0 auto', padding: '44px 28px 0' }}>
            <div className="fk-rev" style={{ marginBottom: 20 }}><Eyebrow>PRŮBĚH ZÁPASU</Eyebrow></div>
            <div className="fk-rev" style={{ ...card, padding: '10px 24px' }}>
              {md.events.map((ev, i) => {
                const homeShow = ev.team === 'h' ? {} : { visibility: 'hidden' };
                const awayShow = ev.team === 'a' ? {} : { visibility: 'hidden' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #F2F3F5' }}>
                    <div style={{ flex: 1, textAlign: 'right', ...homeShow }}><span style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{ev.player}</span> <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{ev.note}</span></div>
                    <div style={{ flex: 'none', width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><span style={styleObj(evIcon(ev.type))}>{ev.type === 'goal' ? <Icon name="ball" size={13} color="#fff" /> : null}</span><span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: '#9AA1AC', width: 24, textAlign: 'center' }}>{ev.min}'</span></div>
                    <div style={{ flex: 1, textAlign: 'left', ...awayShow }}><span style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{ev.player}</span> <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{ev.note}</span></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ maxWidth: 1000, margin: '0 auto', padding: '44px 28px 0' }}>
            <div className="fk-rev" style={{ marginBottom: 20 }}><Eyebrow>FOTKY ZE ZÁPASU</Eyebrow></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 150, gap: 14 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Hov key={i} className="fk-rev fk-zoom" style={`${galleryCells[i]};border-radius:16px;overflow:hidden;position:relative;cursor:pointer`}>
                  <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: galleryImgs[i], backgroundSize: 'cover', backgroundPosition: 'center' }} />
                </Hov>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 28px 0' }}>
          <div className="fk-rev" style={{ marginBottom: 22 }}><Eyebrow>POSLEDNÍ ZÁPAS</Eyebrow></div>
          {hasLastSummary ? (
            <div className="fk-rev" style={{ ...card, padding: 'clamp(24px,4vw,32px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 18, color: '#fff', flex: 'none' }}>FK</div>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#121212', letterSpacing: '.5px' }}>FK Kunice <span style={{ color: '#9AA1AC' }}>vs</span> {lm.opp}</div>
                    <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 800, letterSpacing: '.5px', padding: '3px 10px', borderRadius: 99, background: '#F4F5F7', color: '#3a3f47' }}>{lm.result}</span>
                  </div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(40px,6vw,56px)', color: '#C1121F', letterSpacing: '2px', lineHeight: 1 }}>{lm.score}</div>
              </div>
              {lm.scorers && lm.scorers.trim() && (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #F2F3F5', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: '#C1121F', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="ball" size={14} color="#fff" /></span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: '#9AA1AC' }}>STŘELCI:</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1E1E' }}>{lm.scorers}</span>
                </div>
              )}
            </div>
          ) : placeholder('Poslední zápas zatím nemáme zadaný.')}
        </section>
      )}

      {/* ============ PŘÍŠTÍ ZÁPAS + ODPOČET ============ */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 28px 0' }}>
        <div className="fk-rev" style={{ marginBottom: 22 }}><Eyebrow>PŘÍŠTÍ ZÁPAS</Eyebrow></div>
        {hasNext ? (
          <div className="fk-rev" style={{ background: 'linear-gradient(155deg,#1c1c1e,#0d0d0f)', borderRadius: 24, padding: 'clamp(24px,4vw,40px)', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(18,18,18,.28)' }}>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: 99, background: 'radial-gradient(circle,rgba(193,18,31,.45),transparent 70%)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: '#D62839', animation: 'fkPulse 1.6s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.65)' }}>{nm.when}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, margin: '26px 0 24px', position: 'relative' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 16, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 20 }}>{nmHome.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '.5px' }}>{nmHome.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nmHome.side || 'Domácí'}</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: 'rgba(255,255,255,.3)', flex: 'none' }}>VS</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 16, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 20 }}>{nmAway.short}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '.5px' }}>{nmAway.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{nmAway.side || 'Hosté'}</div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.08)', padding: '10px 16px', borderRadius: 14, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>
              <Icon name="pin" size={15} /> {nm.venue || 'Areál Kunice'}
            </div>
            {nm.dateISO ? <Countdown targetISO={nm.dateISO} /> : null}
          </div>
        ) : placeholder('Termín dalšího zápasu zveřejníme brzy.')}
      </section>

      {/* ============ TABULKA ============ */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 28px 110px' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <Eyebrow>TABULKA SOUTĚŽE</Eyebrow>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#C1121F', background: '#FBEAEC', padding: '4px 11px', borderRadius: 99 }}>{t.comp}</span>
        </div>
        {table.length > 0 ? (
          <div className="fk-rev" style={{ ...card, padding: '8px 24px', maxWidth: 720 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '2px solid #F2F3F5', fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#9AA1AC' }}>
              <span style={{ width: 22 }}>#</span><span style={{ flex: 1 }}>TÝM</span><span style={{ width: 40, textAlign: 'center' }}>ZÁP.</span><span style={{ width: 36, textAlign: 'right' }}>B.</span>
            </div>
            {table.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px ' + (row.me ? '10px' : '0'), borderRadius: row.me ? 10 : 0, ...(row.me ? { background: '#FBEAEC', margin: '2px -8px' } : { borderBottom: i < table.length - 1 ? '1px solid #F2F3F5' : 'none' }) }}>
                <span style={{ fontFamily: "'Bebas Neue'", width: 22, fontSize: 17, color: row.me ? '#C1121F' : (row.pos <= 3 ? '#1E1E1E' : '#B7BCC4') }}>{row.pos}</span>
                <span style={{ flex: 1, fontWeight: row.me ? 800 : 600, fontSize: 14, color: '#1E1E1E' }}>{row.team}</span>
                <span style={{ width: 40, textAlign: 'center', fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>{row.gp}</span>
                <span style={{ fontFamily: "'Bebas Neue'", width: 36, textAlign: 'right', fontSize: 18, color: row.me ? '#C1121F' : '#121212' }}>{row.pts}</span>
              </div>
            ))}
          </div>
        ) : placeholder('Tabulka soutěže se připravuje — načítá se z oficiálního systému FAČR.')}
      </section>
    </div>
  );
}
