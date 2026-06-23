'use client';
import { Hov, Eyebrow } from '@/app/components/ui';
import { Icon, emojiIcon } from '@/app/components/icons';
import { COLORS } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';

export default function Kontakt() {
  useRevealEngine();
  const { quickActions, people } = useContent();

  return (
    <div style={{ background: '#F6F7F9' }}>
      {/* ============ HERO ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '128px 28px 0' }}>
        <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <span style={{ width: 28, height: 3, background: COLORS.red, borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: COLORS.red }}>KONTAKT</span>
        </div>
        <h1 className="fk-rev" style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(48px,7vw,100px)', lineHeight: 1.12, textTransform: 'uppercase', color: COLORS.ink, letterSpacing: '.5px' }}>Spojte se s námi</h1>
        <p className="fk-rev" style={{ color: '#6B7280', fontSize: 19, marginTop: 18, maxWidth: 600, lineHeight: 1.55 }}>Máte zájem o nábor, pronájem nebo spolupráci? Ozvěte se — rádi vám pomůžeme.</p>
      </section>

      {/* ============ STYLIZED MAP ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 28px 0' }}>
        <div className="fk-rev" style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 360, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 14px 40px rgba(18,18,18,.08)', background: 'linear-gradient(135deg,#1d2127,#3b4452)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
          <div style={{ position: 'absolute', left: 0, top: '42%', right: 0, height: 30, background: 'rgba(193,18,31,.25)', transform: 'rotate(-4deg)' }} />
          <div style={{ position: 'absolute', left: '36%', top: 0, bottom: 0, width: 26, background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: COLORS.red, boxShadow: '0 12px 28px rgba(193,18,31,.5)' }} />
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 14, color: COLORS.ink, boxShadow: '0 8px 20px rgba(0,0,0,.2)' }}>Areál FK Kunice</div>
          </div>
        </div>
      </section>

      {/* ============ QUICK ACTIONS ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 28px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {quickActions.map((qa, i) => (
            <Hov key={i} className="fk-rev" style="background:#fff;border-radius:20px;padding:26px;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05);cursor:pointer;transition:transform .3s,box-shadow .3s" hover="transform:translateY(-6px);box-shadow:0 22px 44px rgba(18,18,18,.12)">
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(193,18,31,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{emojiIcon(qa.emoji) ? <Icon name={emojiIcon(qa.emoji)} size={22} color={COLORS.red} /> : qa.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{qa.title}</div>
              <div style={{ fontSize: 14, color: COLORS.red, fontWeight: 600, marginTop: 4 }}>{qa.value}</div>
            </Hov>
          ))}
        </div>
      </section>

      {/* ============ PEOPLE + FORM ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 28px 110px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* left: people */}
        <div>
          <div className="fk-rev" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
            <span style={{ width: 28, height: 3, background: COLORS.red, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: COLORS.red }}>KLUBOVÉ KONTAKTY</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {people.map((pe, i) => (
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 18, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 99, background: pe.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>{pe.ini}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{pe.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>{pe.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#3a3f47' }}>{pe.phone}</div>
                  <div style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{pe.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right: form */}
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 22, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: COLORS.ink, marginBottom: 18 }}>Napište nám</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Hov as="input" placeholder="Jméno a příjmení" style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:13px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="input" placeholder="E-mail" style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:13px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="textarea" placeholder="Vaše zpráva" rows={4} style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:13px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none;resize:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="a" style="text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:16px;border-radius:14px;cursor:pointer;box-shadow:0 12px 30px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-2px);background:#D62839;color:#fff">Odeslat zprávu →</Hov>
          </div>
        </div>
      </section>
    </div>
  );
}
