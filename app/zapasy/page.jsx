'use client';
import Link from 'next/link';
import { Hov, Eyebrow } from '@/app/components/ui';
import { COLORS, PH } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

// ikona události dle typu (návrh řádky 1150–1154)
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

export default function MatchDetail() {
  useRevealEngine();
  const { matchDetail } = useContent();
  const { header, when, home, away, score, result, events, stats } = matchDetail;

  // galerie — 8 gradient placeholderů (vzor z home galerie)
  const galleryCells = ['grid-column:span 2;grid-row:span 2', '', '', 'grid-column:span 2', '', '', 'grid-column:span 2', ''];
  const galleryImgs = [PH.dusk, PH.sunset, PH.slate, PH.cool, PH.warm, PH.char, PH.red, PH.ember];

  return (
    <div style={{ background: COLORS.bg }}>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '128px 0 56px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#1c1c1e,#0d0d0f)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 80% at 50% 120%,rgba(193,18,31,.4),transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', padding: '0 28px', textAlign: 'center' }}>
          <div className="fk-rev" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#D62839', marginBottom: 8 }}>{header}</div>
          <div className="fk-rev" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 600, marginBottom: 30 }}>{when}</div>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(20px,5vw,64px)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 'clamp(76px,9vw,108px)', height: 'clamp(76px,9vw,108px)', margin: '0 auto 16px', borderRadius: 22, background: 'linear-gradient(160deg,#D62839,#8E0F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 'clamp(28px,3.6vw,42px)', color: '#fff', boxShadow: '0 12px 30px rgba(193,18,31,.45)' }}>{home.short}</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(20px,2.4vw,28px)', color: '#fff', letterSpacing: '.5px' }}>{home.name}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(64px,11vw,116px)', color: '#fff', lineHeight: 1, letterSpacing: '2px' }}>{score.home}<span style={{ color: 'rgba(255,255,255,.35)', margin: '0 8px' }}>:</span>{score.away}</div>
              <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(31,138,76,.18)', color: '#39C46E', fontSize: 11, fontWeight: 800, letterSpacing: '1px', padding: '5px 12px', borderRadius: 99 }}>{result}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 'clamp(76px,9vw,108px)', height: 'clamp(76px,9vw,108px)', margin: '0 auto 16px', borderRadius: 22, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue'", fontSize: 'clamp(28px,3.6vw,42px)', color: '#fff' }}>{away.short}</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(20px,2.4vw,28px)', color: '#fff', letterSpacing: '.5px' }}>{away.name}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRŮBĚH ZÁPASU ============ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '72px 28px 0' }}>
        <div className="fk-rev" style={{ marginBottom: 24 }}><Eyebrow>PRŮBĚH ZÁPASU</Eyebrow></div>
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: '10px 24px', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)' }}>
          {events.map((ev, i) => {
            const glyph = ev.type === 'goal' ? '⚽' : '';
            const homeShow = ev.team === 'h' ? {} : { visibility: 'hidden' };
            const awayShow = ev.team === 'a' ? {} : { visibility: 'hidden' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #F2F3F5' }}>
                <div style={{ flex: 1, textAlign: 'right', ...homeShow }}><span style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{ev.player}</span> <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{ev.note}</span></div>
                <div style={{ flex: 'none', width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><span style={styleObj(evIcon(ev.type))}>{glyph}</span><span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: '#9AA1AC', width: 24, textAlign: 'center' }}>{ev.min}'</span></div>
                <div style={{ flex: 1, textAlign: 'left', ...awayShow }}><span style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{ev.player}</span> <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{ev.note}</span></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ STATISTIKY ============ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 28px 0' }}>
        <div className="fk-rev" style={{ marginBottom: 24 }}><Eyebrow>STATISTIKY</Eyebrow></div>
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.05)' }}>
          {stats.map((ms, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#C1121F' }}>{ms.h}</span>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#9AA1AC', textTransform: 'uppercase' }}>{ms.label}</span>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#1E1E1E' }}>{ms.a}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: '#EFF1F4', overflow: 'hidden', display: 'flex' }}><div style={{ width: ms.hPct, background: '#C1121F', height: '100%' }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FOTKY ZE ZÁPASU ============ */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 28px 110px' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
          <Eyebrow>FOTKY ZE ZÁPASU</Eyebrow>
          <Hov as="a" style="background:#121212;color:#fff;font-weight:700;font-size:14px;padding:13px 22px;border-radius:14px;cursor:pointer;transition:transform .2s" hover="transform:translateY(-2px);color:#fff">⤓ Stáhnout zápasový report</Hov>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 150, gap: 14 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Hov key={i} className="fk-rev fk-zoom" style={`${galleryCells[i]};border-radius:16px;overflow:hidden;position:relative;cursor:pointer`}>
              <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: galleryImgs[i], backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </Hov>
          ))}
        </div>
      </section>
    </div>
  );
}
