'use client';
import { useState } from 'react';
import { Hov, Eyebrow } from '@/app/components/ui';
import { COLORS } from '@/lib/design';
import { useRevealEngine } from '@/lib/useRevealEngine';
import { useContent } from '@/lib/store';
import { Vyber } from '@/app/components/Vyber';

const inputBase = 'border:1px solid #ECEEF1;background:#FAFBFC;border-radius:10px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none';
const inputFocus = 'border-color:#C1121F;background:#fff';

export default function Kontakt() {
  useRevealEngine();
  const { quickActions, people, club, teams } = useContent();
  const mapQuery = club.mapQuery || `${club.address.street}, ${club.address.zip} ${club.address.city}`;
  const [msg, setMsg] = useState({ name: '', email: '', text: '' });
  const [sent, setSent] = useState(false);

  // přihláška do klubu (nábor) — jde do administrace jako „nová"
  const [reg, setReg] = useState({ name: '', birthdate: '', team: '', parent: '', contact: '', note: '' });
  const [regSent, setRegSent] = useState(false);
  const [regChyba, setRegChyba] = useState('');
  const setR = (k) => (e) => setReg((r) => ({ ...r, [k]: e.target.value }));

  const sendReg = async () => {
    setRegChyba('');
    if (!reg.name.trim()) { setRegChyba('Vyplň prosím jméno zájemce.'); return; }
    if (!reg.contact.trim()) { setRegChyba('Vyplň prosím kontakt, ať se máme kam ozvat.'); return; }
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'registration', payload: { ...reg, team: reg.team || teams[0]?.name || '' } }),
      });
      if (!res.ok) { setRegChyba('Přihlášku se nepodařilo odeslat. Zkus to prosím znovu.'); return; }
      setRegSent(true);
    } catch {
      setRegChyba('Server je nedostupný. Zkus to prosím za chvíli.');
    }
  };
  const setM = (k) => (e) => setMsg((m) => ({ ...m, [k]: e.target.value }));
  const sendMsg = async () => {
    if (!msg.name.trim() || !msg.text.trim()) { alert('Vyplň prosím jméno a zprávu.'); return; }
    setSent(true);
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', payload: { name: msg.name.trim(), email: msg.email.trim(), text: msg.text.trim() } }),
      });
    } catch (e) {
      console.warn('[kontakt] odeslání se nezdařilo:', e?.message);
    }
  };

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

      {/* ============ KONTAKTY VLEVO + MAPA VPRAVO ============ */}
      <section className="fk-kontakt-mapa" style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 28px 0', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 28, alignItems: 'stretch' }}>
        {/* vlevo: adresa a rychlé kontakty */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 26, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: COLORS.red, marginBottom: 12 }}>KDE NÁS NAJDETE</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: COLORS.ink, letterSpacing: '.3px' }}>Areál FK Kunice</div>
            <div style={{ fontSize: 15, color: '#3a3f47', fontWeight: 500, lineHeight: 1.7, marginTop: 8 }}>
              {club.address.street}<br />{club.address.zip} {club.address.city}
            </div>
            <Hov
              as="a"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style="display:inline-block;margin-top:18px;background:#C1121F;color:#fff;font-weight:700;font-size:14px;padding:13px 22px;border-radius:10px;cursor:pointer;transition:background .25s,transform .25s"
              hover="background:#D62839;transform:translateY(-2px);color:#fff"
            >
              Navigovat do areálu
            </Hov>
          </div>

          <div className="fk-kontakt-dlazdice" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {quickActions.map((qa, i) => (
              <Hov key={i} className="fk-rev" style="background:#fff;border-radius:10px;padding:20px;box-shadow:0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05);cursor:pointer;transition:transform .3s,box-shadow .3s" hover="transform:translateY(-6px);box-shadow:0 22px 44px rgba(18,18,18,.12)">
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(193,18,31,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{qa.title.slice(0, 1).toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{qa.title}</div>
                <div style={{ fontSize: 13, color: COLORS.red, fontWeight: 600, marginTop: 4 }}>{qa.value}</div>
              </Hov>
            ))}
          </div>
        </div>

        {/* vpravo: živá Google mapa (adresa se nastavuje v administraci) */}
        <div className="fk-rev" style={{ borderRadius: 10, overflow: 'hidden', minHeight: 420, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 14px 40px rgba(18,18,18,.08)', background: '#EFF1F4' }}>
          <iframe
            title="Mapa — Areál FK Kunice"
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=cs&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            style={{ border: 0, width: '100%', height: '100%', minHeight: 420, display: 'block' }}
          />
        </div>
      </section>

      {/* ============ PŘIHLÁŠKA DO KLUBU ============ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 28px 0' }}>
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <span style={{ width: 28, height: 3, background: COLORS.red, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: COLORS.red }}>NÁBOR</span>
          </div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: COLORS.ink, letterSpacing: '.3px' }}>Přihláška do klubu</div>
          <p style={{ color: '#6B7280', fontSize: 15, marginTop: 6, lineHeight: 1.6, maxWidth: 640 }}>
            První tři tréninky jsou nezávazné a zdarma. Vyplň přihlášku a my se ozveme s termínem.
          </p>

          {regSent ? (
            <div style={{ background: '#EAF6EE', border: '1px solid #BfE6CC', borderRadius: 10, padding: 24, textAlign: 'center', marginTop: 22, maxWidth: 640 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#1F8A4C' }}>Přihláška odeslána</div>
              <div style={{ color: '#3a3f47', fontSize: 14, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>Děkujeme! Ozveme se vám s termínem prvního tréninku.</div>
              <div onClick={() => { setRegSent(false); setReg({ name: '', birthdate: '', team: '', parent: '', contact: '', note: '' }); }} style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: COLORS.red, cursor: 'pointer' }}>Přihlásit dalšího</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 22 }} className="fk-nabor">
              <Hov as="input" value={reg.name} onChange={setR('name')} placeholder="Jméno a příjmení zájemce" style={inputBase} focus={inputFocus} />
              <Hov as="input" type="date" value={reg.birthdate} onChange={setR('birthdate')} placeholder="Datum narození" style={inputBase} focus={inputFocus} />
              <Vyber ariaLabel="Tým nebo kategorie" value={reg.team || (teams[0] ? teams[0].name : '')} onChange={(v) => setReg((r) => ({ ...r, team: v }))} options={teams.map((t) => t.name)} placeholder="Tým / kategorie" />
              <Hov as="input" value={reg.parent} onChange={setR('parent')} placeholder="Jméno rodiče (u dětí)" style={inputBase} focus={inputFocus} />
              <Hov as="input" value={reg.contact} onChange={setR('contact')} placeholder="Telefon nebo e-mail" style={inputBase} focus={inputFocus} />
              <Hov as="input" value={reg.note} onChange={setR('note')} placeholder="Poznámka (nepovinné)" style={inputBase} focus={inputFocus} />
              {regChyba && (
                <div style={{ gridColumn: '1 / -1', background: '#FBEAEC', color: COLORS.red, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>{regChyba}</div>
              )}
              <Hov as="a" onClick={sendReg} style="grid-column:1 / -1;text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:16px;border-radius:10px;cursor:pointer;box-shadow:0 12px 30px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-2px);background:#D62839;color:#fff">Odeslat přihlášku</Hov>
            </div>
          )}
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
              <div key={i} className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 22px rgba(18,18,18,.05)' }}>
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
        <div className="fk-rev" style={{ background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 10px 30px rgba(18,18,18,.06)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: COLORS.ink, marginBottom: 18 }}>Napište nám</div>
          {sent ? (
            <div style={{ background: '#EAF6EE', border: '1px solid #BfE6CC', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#1F8A4C' }}>Zpráva odeslána</div>
              <div style={{ color: '#3a3f47', fontSize: 14, fontWeight: 500, marginTop: 6, lineHeight: 1.5 }}>Děkujeme! Ozveme se vám co nejdříve.</div>
              <div onClick={() => { setSent(false); setMsg({ name: '', email: '', text: '' }); }} style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: COLORS.red, cursor: 'pointer' }}>Napsat další zprávu</div>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Hov as="input" value={msg.name} onChange={setM('name')} placeholder="Jméno a příjmení" style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:10px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="input" value={msg.email} onChange={setM('email')} placeholder="E-mail" style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:10px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="textarea" value={msg.text} onChange={setM('text')} placeholder="Vaše zpráva" rows={4} style="border:1px solid #ECEEF1;background:#FAFBFC;border-radius:10px;padding:14px 16px;font-size:14px;font-family:Inter;color:#1E1E1E;outline:none;resize:none" focus="border-color:#C1121F;background:#fff" />
            <Hov as="a" onClick={sendMsg} style="text-align:center;background:#C1121F;color:#fff;font-weight:700;font-size:16px;padding:16px;border-radius:10px;cursor:pointer;box-shadow:0 12px 30px rgba(193,18,31,.4);transition:transform .25s,background .25s" hover="transform:translateY(-2px);background:#D62839;color:#fff">Odeslat zprávu</Hov>
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
