// GET /api/og/match?home=…&away=…&score=… → vygeneruje vizuál výsledku.
//
// Formát 1080 × 1350 px (poměr 4:5) — ten Instagram i Facebook zobrazí v plné
// výšce. Široké 1200 × 630 je formát pro náhledy odkazů, ne pro příspěvky.
// Skladba vychází z toho, jak posty dělá klub: nápis a znak nahoře, velké slovo
// (KONEC / VÝHRA), pod ním skóre mezi znaky obou týmů, svislý hashtag u okraje.
//
// Všechny texty jsou parametry adresy, takže administrace mění vizuál bez zásahu
// do kódu. Fotka na pozadí je nahraná v administraci a uložená jako data URL —
// do adresy by se nevešla, proto se posílá jen `?post=<id>` a obsah si načteme.
// Pozor: satori vyžaduje `display: flex` u každého <div> s víc potomky.
import { ImageResponse } from '@vercel/og';
import { getStoredContent } from '@/lib/db';
import { mergeStored, findOpponentLogo } from '@/lib/defaults';

// nodejs (ne edge) — potřebujeme přístup k uloženému obsahu kvůli fotce
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RED = '#C1121F';
const RED_BRIGHT = '#D62839';
const INK = '#0b0b0d';

const W = 1080;
const H = 1350;

// „3:1" → { home: '3', away: '1' }; zvládne i „3 - 1" nebo „3 × 1"
function splitScore(score) {
  const m = String(score || '').match(/(\d{1,2})\s*[:x×\-–]\s*(\d{1,2})/i);
  return m ? { home: m[1], away: m[2] } : { home: '', away: '' };
}

// zkratka týmu do kolečka, když nemáme jeho znak
function initials(name) {
  const words = String(name || '').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Znak týmu: náš klub má logo, soupeř dlaždici se zkratkou.
function Crest({ name, logo }) {
  if (logo) {
    return (
      <div style={{ display: 'flex', width: 190, height: 190, alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 24, padding: 14 }}>
        <img src={logo} width={162} height={162} style={{ objectFit: 'contain' }} alt="" />
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex', width: 190, height: 190, alignItems: 'center', justifyContent: 'center',
        borderRadius: 24, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.18)',
        fontSize: 62, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
      }}
    >
      {initials(name)}
    </div>
  );
}

// Obsah webu potřebujeme kvůli fotce (ta se do adresy nevejde) a kvůli znakům
// soupeřů. Když se načíst nepovede, vykreslíme aspoň vizuál z parametrů.
async function loadContent() {
  try {
    const stored = await getStoredContent();
    return stored ? mergeStored(stored) : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const p = url.searchParams;
  const content = await loadContent();
  const postId = p.get('post');
  const post = postId && content ? content.socialPosts.find((x) => x.id === postId) : null;
  const saved = post ? post.visual : {};
  const opponents = content ? content.opponents : [];
  // hodnota z adresy má přednost před uloženou (kvůli náhledům a ručním úpravám)
  const val = (key, fallback) => p.get(key) || saved[key] || fallback;

  const title = val('title', 'VÝSLEDEK');
  const home = val('home', 'FK KUNICE');
  const away = val('away', 'SOUPEŘ');
  const score = val('score', '0:0');
  const competition = val('competition', '');
  const date = val('date', '');
  const scorers = val('scorers', '');
  const hashtag = val('hashtag', '#jednotajedeme');
  const photo = val('photo', '');

  // Znak týmu: nahraný u příspěvku → z registru soupeřů → náš klub podle názvu.
  const clubLogo = `${url.origin}/logo-og.png`;
  const isUs = (name) => name.toLowerCase().includes('kunice');
  const logoFor = (name, override) => override || (isUs(name) ? clubLogo : findOpponentLogo(opponents, name));
  const homeLogo = logoFor(home, val('homeLogo', ''));
  const awayLogo = logoFor(away, val('awayLogo', ''));

  const goals = splitScore(score);
  const logo = clubLogo;

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: '64px 60px 72px',
          position: 'relative',
        }}
      >
        {/* fotka na pozadí (nahraje se v administraci) + ztmavení kvůli čitelnosti */}
        {!!photo && (
          <img
            src={photo}
            width={W}
            height={H}
            style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, objectFit: 'cover' }}
            alt=""
          />
        )}
        {!!photo && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, display: 'flex', background: 'linear-gradient(180deg, rgba(11,11,13,0.78) 0%, rgba(11,11,13,0.55) 38%, rgba(11,11,13,0.92) 78%, rgba(11,11,13,0.97) 100%)' }} />
        )}

        {/* červená záře shora */}
        {!photo && (
          <div style={{ position: 'absolute', top: -260, left: -10, width: 1100, height: 900, borderRadius: 999, background: 'radial-gradient(circle, rgba(193,18,31,0.42), rgba(11,11,13,0) 68%)', display: 'flex' }} />
        )}

        {/* svislý hashtag u levého okraje */}
        <div
          style={{
            position: 'absolute', left: 14, top: 470, display: 'flex',
            transform: 'rotate(-90deg)', transformOrigin: 'left top',
            fontSize: 26, fontWeight: 800, letterSpacing: 3, color: 'rgba(255,255,255,0.45)',
          }}
        >
          {hashtag}
        </div>

        {/* HLAVIČKA — klubový nápis vlevo, znak vpravo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: 6 }}>FK KUNICE</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 10, color: RED_BRIGHT, marginTop: 6 }}>1934</div>
          </div>
          <div style={{ display: 'flex', width: 132, height: 132, alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 20, padding: 12 }}>
            <img src={logo} width={108} height={108} style={{ objectFit: 'contain' }} alt="" />
          </div>
        </div>

        {/* STŘED — velké slovo, skóre mezi znaky týmů */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {!!competition && (
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
              {competition.toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', fontSize: 128, fontWeight: 800, letterSpacing: 2, lineHeight: 1 }}>
            {title.toUpperCase()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 46, width: '100%' }}>
            <Crest name={home} logo={homeLogo} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 34px' }}>
              <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{goals.home}</div>
              <div style={{ display: 'flex', fontSize: 92, fontWeight: 800, color: RED_BRIGHT, padding: '0 22px' }}>×</div>
              <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{goals.away}</div>
            </div>
            <Crest name={away} logo={awayLogo} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: 26, width: '100%' }}>
            <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.82)', textAlign: 'right' }}>{home}</div>
            <div style={{ display: 'flex', width: 140 }} />
            <div style={{ display: 'flex', flex: 1, fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>{away}</div>
          </div>
        </div>

        {/* PATIČKA — střelci, claim, datum */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {!!scorers && (
            <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 16 }}>
              {`Branky: ${scorers}`}
            </div>
          )}
          <div style={{ display: 'flex', width: 120, height: 4, background: RED, borderRadius: 4, marginBottom: 18 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, letterSpacing: 3, color: RED_BRIGHT }}>SPOLEČNĚ SILNĚJŠÍ.</div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
