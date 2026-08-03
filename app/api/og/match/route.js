// GET /api/og/match?home=…&away=…&score=… → vygeneruje obrázek výsledku.
// Šablona v klubových barvách; všechny texty jdou nastavit parametry, takže
// administrace může vizuál upravovat bez zásahu do kódu.
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const RED = '#C1121F';
const RED_BRIGHT = '#D62839';
const INK = '#0c0c0e';

export function GET(req) {
  const p = new URL(req.url).searchParams;
  const title = p.get('title') || 'VÝSLEDEK';
  const home = p.get('home') || 'FK KUNICE';
  const away = p.get('away') || 'SOUPEŘ';
  const score = p.get('score') || '0:0';
  const competition = p.get('competition') || '';
  const date = p.get('date') || '';
  const scorers = p.get('scorers') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: '56px 64px',
          position: 'relative',
        }}
      >
        {/* červená záře v rohu */}
        <div style={{ position: 'absolute', top: -180, right: -120, width: 620, height: 620, borderRadius: 999, background: 'radial-gradient(circle, rgba(214,40,57,0.45), rgba(12,12,14,0) 70%)', display: 'flex' }} />

        {/* hlavička */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 10, height: 44, background: RED, borderRadius: 4, marginRight: 18, display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 2 }}>{title.toUpperCase()}</div>
              {!!competition && <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 4 }}>{competition}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 3 }}>FK KUNICE</div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 4 }}>EST. 1934</div>
          </div>
        </div>

        {/* skóre */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', paddingRight: 40 }}>
            <div style={{ fontSize: 54, fontWeight: 800, textAlign: 'right', lineHeight: 1.1, maxWidth: 380, display: 'flex' }}>{home}</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 260,
              padding: '18px 34px',
              borderRadius: 24,
              background: `linear-gradient(160deg, ${RED_BRIGHT}, #8E0F18)`,
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {score}
          </div>
          <div style={{ display: 'flex', flex: 1, paddingLeft: 40 }}>
            <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1, maxWidth: 380, display: 'flex' }}>{away}</div>
          </div>
        </div>

        {/* patička */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 800 }}>
            {!!scorers && <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.85)', fontWeight: 600, display: 'flex' }}>{`Branky: ${scorers}`}</div>}
            <div style={{ fontSize: 22, color: RED_BRIGHT, fontWeight: 800, letterSpacing: 2, marginTop: 10 }}>SPOLEČNĚ SILNĚJŠÍ.</div>
          </div>
          {!!date && <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{date}</div>}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
