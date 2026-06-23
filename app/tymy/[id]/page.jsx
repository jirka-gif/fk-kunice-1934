'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hov, Eyebrow, H2 } from '@/app/components/ui';
import { Icon } from '@/app/components/icons';
import { COLORS, PH, PH_ARR, photo, initials } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

export default function TeamDetail() {
  useRevealEngine();
  const { teams, ageBase, posCycle } = useContent();
  const params = useParams();
  const teamId = params.id;
  const curTeam = teams.find((t) => t.id === teamId) || teams[0];

  const [player, setPlayer] = useState(null);

  // ===== computed (z návrhu, řádky 1122–1147) =====
  const teamChips = teams.map((t) => ({
    id: t.id,
    name: t.name,
    style:
      'font-size:13px;font-weight:700;padding:9px 16px;border-radius:99px;cursor:pointer;transition:all .2s;' +
      (t.id === curTeam.id
        ? 'background:#C1121F;color:#fff'
        : 'background:rgba(255,255,255,.1);color:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.2)'),
  }));

  const teamEyebrow = (curTeam.comp + ' · ' + curTeam.cat.split(' · ')[0]).toUpperCase();
  const hasRoster = curTeam.players.length > 0;
  const hasCoaches = curTeam.coaches.length > 0;
  const teamDesc = hasRoster
    ? 'Aktuální soupiska, realizační tým a soutěž ' + curTeam.comp + '. Sleduj zápasy, výsledky a život týmu.'
    : 'Tým ' + curTeam.name + ' je součástí naší akademie. Kompletní soupiska a rozpis se připravují — ozvi se nám pro nábor.';
  const teamContact = curTeam.contact;

  const teamStats = [
    { value: String(curTeam.players.length || '—'), label: 'Hráčů', color: '#C1121F' },
    { value: String(curTeam.coaches.length || '—'), label: 'Trenérů', color: '#121212' },
    { value: curTeam.short, label: 'Kategorie', color: '#121212' },
    { value: '1934', label: 'Založeno', color: '#121212' },
  ].map((t, i) => ({ ...t, cell: 'padding:24px 16px;text-align:center;' + (i < 3 ? 'border-right:1px solid #F2F3F5' : '') }));

  const curCoaches = curTeam.coaches.map((c, i) => ({
    name: c.n,
    role: c.r,
    img: PH_ARR[i % PH_ARR.length],
    licence:
      c.r.indexOf('Hlavní') >= 0
        ? 'UEFA B licence'
        : c.r.indexOf('Vedoucí') >= 0
        ? 'Vedení týmu'
        : 'Trenérská licence C',
    contact: curTeam.contact || 'info@fkkunice.cz',
  }));

  const has = (v) => v !== undefined && v !== null && v !== '';
  const players = curTeam.players.map((p, i) => {
    const pos = p.position || posCycle[i % posCycle.length];
    const age = has(p.age) ? p.age : (ageBase[curTeam.id] || 20) + (i % 3);
    const apps = has(p.apps) ? p.apps : 6 + ((i * 5) % 14);
    const goals = has(p.goals) ? p.goals : (pos === 'GK' ? 0 : pos === 'ÚTO' ? (i * 3) % 11 : (i * 2) % 6);
    const num = has(p.number) ? p.number : i + 1;
    const img = p.photo ? `url(${p.photo})` : PH_ARR[i % PH_ARR.length];
    return { num, name: p.name, pos, age, apps, goals, img, team: curTeam.name, since: p.since, favClub: p.favClub, favPlayer: p.favPlayer, assists: p.assists };
  });

  const schedule = [
    { day: 'Úterý', place: 'Hlavní hřiště', time: '18:00' },
    { day: 'Čtvrtek', place: 'Hlavní hřiště', time: '18:00' },
    { day: 'Neděle', place: 'Mistrovský zápas', time: '16:30' },
  ];

  const galleryCells = ['grid-column:span 2;grid-row:span 2', '', '', 'grid-column:span 2', '', '', 'grid-column:span 2', ''];
  const galleryImgs = [PH.dusk, PH.sunset, PH.slate, PH.cool, PH.warm, PH.char, PH.red, PH.ember];

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '142px 0 70px', overflow: 'hidden', background: '#121212' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg,#2c2620,#7a4e2e)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,10,11,.5),rgba(10,10,11,.9))' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 80% at 88% 0%,rgba(193,18,31,.32),transparent 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            <Hov as={Link} href="/" style="color:rgba(255,255,255,.6);cursor:pointer" hover="color:#fff">Domů</Hov>
            <span style={{ color: 'rgba(255,255,255,.3)' }}>/</span>
            <span style={{ color: '#fff' }}>Týmy</span>
          </div>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#D62839' }}>{teamEyebrow}</span>
          </div>
          <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(56px,9vw,124px)', lineHeight: 1.22, textTransform: 'uppercase', color: '#fff', letterSpacing: '.5px' }}>{curTeam.name}</h1>
          <p className="fk-rev" style={{ color: 'rgba(255,255,255,.8)', fontSize: 18, marginTop: 18, maxWidth: 580, lineHeight: 1.55 }}>{teamDesc}</p>
          {teamContact && (
            <div className="fk-rev" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 16, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600 }}><Icon name="phone" size={15} /> {teamContact}</div>
          )}
          <div className="fk-rev" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 28 }}>
            {teamChips.map((tc) => (
              <Hov key={tc.id} as={Link} href={`/tymy/${tc.id}`} style={tc.style}>{tc.name}</Hov>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section style={{ maxWidth: 1200, margin: '-36px auto 0', padding: '0 28px', position: 'relative', zIndex: 5 }}>
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgba(18,18,18,.05),0 18px 44px rgba(18,18,18,.1)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {teamStats.map((ts, i) => (
            <div key={i} style={css(ts.cell)}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 38, color: ts.color, lineHeight: 1 }}>{ts.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#9AA1AC', marginTop: 6, textTransform: 'uppercase' }}>{ts.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MAIN + SIDEBAR ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 28px 0', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          {/* REALIZAČNÍ TÝM */}
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>REALIZAČNÍ TÝM</span>
          </div>
          {hasCoaches ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {curCoaches.map((st, i) => (
                <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)' }}>
                  <div style={{ height: 130, background: st.img, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: '#C1121F', fontWeight: 700, marginTop: 3 }}>{st.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}><Icon name="award" size={14} /> {st.licence}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', fontWeight: 600, marginTop: 4 }}><Icon name="mail" size={14} /> {st.contact}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)', textAlign: 'center', color: '#9AA1AC', fontSize: 14, fontWeight: 600 }}>Realizační tým tohoto týmu připravujeme. Pro nábor a informace nás kontaktujte.</div>
          )}

          {/* SOUPISKA */}
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '48px 0 22px' }}>
            <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>SOUPISKA</span>
          </div>
          {hasRoster ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {players.map((pl, i) => (
                <Hov key={i} className="fk-rev fk-zoom" onClick={() => setPlayer(pl)} style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05);cursor:pointer;transition:transform .3s,box-shadow .3s" hover="transform:translateY(-6px);box-shadow:0 22px 44px rgba(18,18,18,.14)">
                  <div className="fk-zi" style={{ height: 160, background: pl.img, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 12, left: 14, fontFamily: "'Bebas Neue'", fontSize: 34, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>{pl.num}</span>
                    <span style={{ position: 'absolute', top: 14, right: 12, background: 'rgba(193,18,31,.92)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.5px', padding: '4px 9px', borderRadius: 99 }}>{pl.pos}</span>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>{pl.name}</div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                      <div><span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#121212' }}>{pl.apps}</span><span style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 600, marginLeft: 4 }}>záp.</span></div>
                      <div><span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#C1121F' }}>{pl.goals}</span><span style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 600, marginLeft: 4 }}>gólů</span></div>
                      <div><span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#121212' }}>{pl.age}</span><span style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 600, marginLeft: 4 }}>let</span></div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F2F3F5', fontSize: 12, fontWeight: 700, color: '#C1121F' }}>Zobrazit profil →</div>
                  </div>
                </Hov>
              ))}
            </div>
          ) : (
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 18, padding: 32, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#121212' }}>Soupiska se připravuje</div>
              <div style={{ color: '#9AA1AC', fontSize: 14, fontWeight: 600, marginTop: 6 }}>Hráči tohoto týmu budou brzy doplněni z klubového systému.</div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 16 }}>TRÉNINKOVÝ ROZPIS</div>
            {schedule.map((sc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F2F3F5' }}>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{sc.day}</div><div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>{sc.place}</div></div>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 17, color: '#C1121F' }}>{sc.time}</span>
              </div>
            ))}
          </div>
          {curTeam.results && curTeam.results.length > 0 && (
            <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC', marginBottom: 14 }}>POSLEDNÍ VÝSLEDKY</div>
              {curTeam.results.map((r, i) => {
                const m = { V: { bg: '#C1121F', c: '#fff' }, R: { bg: '#EFF1F4', c: '#9AA1AC' }, P: { bg: '#F3F0E9', c: '#A98C4E' } }[r.wld] || { bg: '#C1121F', c: '#fff' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F3F5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, background: m.bg, color: m.c }}>{r.wld}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#1E1E1E' }}>{r.opp}</span>
                    </div>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#121212', letterSpacing: '1px' }}>{r.score}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="fk-rev" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#9AA1AC' }}>TABULKA SOUTĚŽE</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#C1121F', background: '#FBEAEC', padding: '3px 9px', borderRadius: 99 }}>FAČR</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>{curTeam.comp}</div>
            {curTeam.table && curTeam.table.length > 0 ? (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
                {curTeam.table.map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px ' + (row.me ? '10px' : '0'), borderRadius: row.me ? 10 : 0, ...(row.me ? { background: '#FBEAEC', margin: '2px -6px' } : { borderBottom: '1px solid #F2F3F5' }) }}>
                    <span style={{ fontFamily: "'Bebas Neue'", width: 20, fontSize: 15, color: row.me ? '#C1121F' : (row.pos <= 3 ? '#1E1E1E' : '#B7BCC4') }}>{row.pos}</span>
                    <span style={{ flex: 1, fontWeight: row.me ? 800 : 600, fontSize: 13.5, color: '#1E1E1E' }}>{row.team}</span>
                    <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, width: 34, textAlign: 'center' }}>{row.gp}</span>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, width: 28, textAlign: 'right', color: row.me ? '#C1121F' : '#121212' }}>{row.pts}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, margin: '4px 0 16px' }}>Načítá se z oficiálního systému FAČR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[0, 1, 2].map((k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 10, borderRadius: 4, background: k === 0 ? '#FBEAEC' : '#F2F3F5' }} />
                      <div style={{ flex: 1, height: 10, borderRadius: 4, background: '#F2F3F5' }} />
                      <div style={{ width: 30, height: 10, borderRadius: 4, background: k === 0 ? '#FBEAEC' : '#F2F3F5' }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Hov as={Link} href="/kontakt" className="fk-rev" style="display:block;text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:17px;border-radius:16px;cursor:pointer;box-shadow:0 14px 34px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-3px);background:#D62839;color:#fff">Přidej se k týmu →</Hov>
        </div>
      </section>

      {/* ============ GALERIE TÝMU ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '84px 28px 110px' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <span style={{ width: 28, height: 3, background: '#C1121F', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: '#C1121F' }}>GALERIE TÝMU</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 160, gap: 14 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Hov key={i} className="fk-rev fk-zoom" style={`${galleryCells[i]};border-radius:16px;overflow:hidden;position:relative;cursor:pointer`}>
              <div className="fk-zi" style={{ position: 'absolute', inset: 0, background: galleryImgs[i], backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </Hov>
          ))}
        </div>
      </section>

      {/* ============ PLAYER MODAL ============ */}
      {player && (
        <div onClick={() => setPlayer(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,10,11,.62)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 740, width: '100%', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.45)', display: 'grid', gridTemplateColumns: '280px 1fr' }}>
            <div style={{ background: player.img, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 380, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 20, left: 22, fontFamily: "'Bebas Neue'", fontSize: 60, color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,.5)', lineHeight: 1 }}>{player.num}</span>
              <span style={{ position: 'absolute', bottom: 20, left: 22, background: 'rgba(193,18,31,.95)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.8px', padding: '6px 12px', borderRadius: 99 }}>{player.pos}</span>
            </div>
            <div style={{ padding: 32, position: 'relative' }}>
              <span onClick={() => setPlayer(null)} style={{ position: 'absolute', top: 20, right: 20, width: 34, height: 34, borderRadius: 99, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700, color: '#6B7280' }}>✕</span>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#C1121F' }}>{player.team}</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 46, color: '#121212', lineHeight: 1.04, marginTop: 6, letterSpacing: '.5px' }}>{player.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 22 }}>
                <div style={{ background: '#F6F7F9', borderRadius: 13, padding: 14 }}><div style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.8px' }}>VĚK</div><div style={{ fontWeight: 700, fontSize: 16, color: '#1E1E1E', marginTop: 3 }}>{player.age} let</div></div>
                <div style={{ background: '#F6F7F9', borderRadius: 13, padding: 14 }}><div style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.8px' }}>V KLUBU OD</div><div style={{ fontWeight: 700, fontSize: 16, color: '#1E1E1E', marginTop: 3 }}>{player.since || '—'}</div></div>
                <div style={{ background: '#F6F7F9', borderRadius: 13, padding: 14 }}><div style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.8px' }}>OBLÍBENÝ KLUB</div><div style={{ fontWeight: 700, fontSize: 16, color: '#1E1E1E', marginTop: 3 }}>{player.favClub || '—'}</div></div>
                <div style={{ background: '#F6F7F9', borderRadius: 13, padding: 14 }}><div style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.8px' }}>OBLÍBENÝ HRÁČ</div><div style={{ fontWeight: 700, fontSize: 16, color: '#1E1E1E', marginTop: 3 }}>{player.favPlayer || '—'}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 28, marginTop: 22, paddingTop: 18, borderTop: '1px solid #F2F3F5' }}>
                <div><div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#121212', lineHeight: 1 }}>{player.apps}</div><div style={{ fontSize: 11, fontWeight: 700, color: '#9AA1AC', marginTop: 2 }}>ZÁPASY</div></div>
                <div><div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#C1121F', lineHeight: 1 }}>{player.goals}</div><div style={{ fontSize: 11, fontWeight: 700, color: '#9AA1AC', marginTop: 2 }}>GÓLY</div></div>
                <div><div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#121212', lineHeight: 1 }}>{(player.assists || player.assists === 0) && player.assists !== '' ? player.assists : '—'}</div><div style={{ fontSize: 11, fontWeight: 700, color: '#9AA1AC', marginTop: 2 }}>ASISTENCE</div></div>
              </div>
              <div style={{ marginTop: 24, fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>Statistiky i profilové údaje se plní z klubového CMS.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Parsuje "a:b;c:d" inline-style string na React style objekt (lokálně, jako na home page).
function css(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const p = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!p) continue;
    out[p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}
