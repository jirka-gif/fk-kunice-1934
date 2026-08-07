'use client';
// Sdílená UI primitiva pro administraci FK Kunice.
import { useRef, useState, useEffect } from 'react';
import { Vyber } from '@/app/components/Vyber';
import { Icon } from '@/app/components/icons';

const RED = '#C1121F';
const LINE = '#ECEEF1';

// Nahrání fotky → zmenší a uloží jako data URL (do localStorage). Náhled + odebrání.
export function ImageField({ label, value, onChange }) {
  const fileRef = useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1100;
        let w = img.width, h = img.height;
        if (w > max) { h = Math.round((h * max) / w); w = max; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        onChange(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  };
  return (
    <div>
      {label && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 120, height: 78, borderRadius: 10, border: `1px solid ${LINE}`, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B7BCC4', fontSize: 11, fontWeight: 600, overflow: 'hidden', ...(value ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: '#F4F5F7' }) }}>
          {!value && 'bez fotky'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          <Btn small kind="ghost" onClick={() => fileRef.current && fileRef.current.click()}>{value ? 'Změnit fotku' : 'Nahrát fotku'}</Btn>
          {value && <Btn small kind="danger" onClick={() => onChange('')}>Odebrat</Btn>}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', placeholder, textarea, rows = 3, width }) {
  const common = {
    border: `1px solid ${LINE}`, background: '#FAFBFC', borderRadius: 10, padding: '11px 13px',
    fontSize: 14, fontFamily: 'Inter', color: '#1E1E1E', outline: 'none', width: '100%',
  };
  return (
    <label style={{ display: 'block', flex: width ? `0 0 ${width}` : 1, minWidth: 0 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>}
      {textarea ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...common, resize: 'vertical' }} />
      ) : (
        <input type={type === 'number' ? 'text' : type} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? e.target.value.replace(/[^0-9-]/g, '') : e.target.value)} placeholder={placeholder} inputMode={type === 'number' ? 'numeric' : undefined} style={common} />
      )}
    </label>
  );
}

// Rozbalovací nabídka v administraci. Vevnitř je stejná komponenta `Vyber`
// jako na webu, takže nabídka vypadá všude stejně — bílé pozadí, červeně
// vybraná položka, jemně červená pod myší. Nativní <select> to napříč
// prohlížeči nakreslit neumí, proto tu není.
//
// Rozhraní zůstává (label, value, onChange, options, width), aby se nemuselo
// sahat na šestnáct míst, kde se komponenta používá.
export function Select({ label, value, onChange, options, width }) {
  return (
    <div style={{ display: 'block', flex: width ? `0 0 ${width}` : 1, minWidth: 0 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>}
      <Vyber value={value ?? ''} onChange={onChange} options={options} ariaLabel={label} sevrene />
    </div>
  );
}

// Přepínač týmů (chips) — sdílený pro sekce editovatelné po týmech.
export function TeamSwitcher({ teams, activeIndex, onSelect, badge }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
      {teams.map((tm, i) => {
        const active = i === activeIndex;
        return (
          <button key={tm.id} onClick={() => onSelect(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s', border: active ? `1px solid ${RED}` : `1px solid ${LINE}`, background: active ? RED : '#fff', color: active ? '#fff' : '#3a3f47' }}>
            {tm.name}
            {badge != null && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{badge(tm)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Row({ children, gap = 12, style }) {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap', alignItems: 'flex-end', ...style }}>{children}</div>;
}

export function Btn({ children, onClick, kind = 'ghost', small, type = 'button' }) {
  const styles = {
    primary: { background: RED, color: '#fff', border: 'none' },
    ghost: { background: '#fff', color: '#3a3f47', border: `1px solid ${LINE}` },
    danger: { background: '#FBEAEC', color: RED, border: 'none' },
    dark: { background: '#121212', color: '#fff', border: 'none' },
  }[kind];
  return (
    <button type={type} onClick={onClick} style={{ ...styles, fontWeight: 700, fontSize: small ? 12 : 14, padding: small ? '7px 11px' : '11px 18px', borderRadius: 10, cursor: 'pointer', transition: 'filter .15s', whiteSpace: 'nowrap' }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(.95)')} onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)', ...style }}>{children}</div>;
}

// `akce` = tlačítka vpravo od nadpisu (typicky „+ Přidat novinku"). Patří sem,
// ne pod seznam — u dlouhého seznamu se k tlačítku dole muselo scrollovat.
export function SectionHead({ title, desc, count, akce }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#121212', letterSpacing: '.3px' }}>{title}</div>
        {count != null && <span style={{ background: '#FBEAEC', color: RED, fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 10 }}>{count}</span>}
        {akce && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{akce}</div>}
      </div>
      {desc && <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginTop: 4 }}>{desc}</div>}
    </div>
  );
}

// Editor pole objektů: přidat / smazat / přesunout. `renderItem(item, update, index)`.
// Sbalený blok pro věci, které klub potřebuje výjimečně (adresy stránek,
// popisky tlačítek). Nezmizí, jen nepřekáží — po rozbalení je všechno tam,
// kde bylo.
export function Pokrocile({ title = 'Pokročilé nastavení', hint, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', background: open ? '#FBF6F6' : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#3a3f47' }}>{title}</span>
          {hint && <span style={{ display: 'block', fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>{hint}</span>}
        </span>
        <span style={{ color: RED, fontWeight: 700, fontSize: 12, flex: 'none' }}>{open ? 'Skrýt' : 'Zobrazit'}</span>
      </button>
      {open && <div style={{ padding: 16, borderTop: `1px solid ${LINE}` }}>{children}</div>}
    </div>
  );
}

// Přepínač zap/vyp. Na první pohled ukáže stav, což textové tlačítko
// („Archivovat" / „Vrátit na web") nedokázalo — z něj nešlo poznat, jestli
// popisuje současný stav, nebo to, co se stane po kliknutí.
export function Prepinac({ value, onChange, label, popisZap = 'Zobrazuje se na webu', popisVyp = 'Skryté, na webu není' }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <span
        role="switch" aria-checked={!!value} aria-label={label} tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!value); } }}
        style={{ width: 42, height: 24, borderRadius: 12, background: value ? '#1F8A4C' : '#D7DBE0', position: 'relative', transition: 'background .2s', flex: 'none' }}
      >
        <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: value ? '#1F8A4C' : '#9AA1AC' }}>{value ? popisZap : popisVyp}</span>
    </label>
  );
}

// Kulaté tlačítko s ikonou — tužka, koš, přesun. Text u nich nedává smysl,
// v řadě jich je několik vedle sebe a názvy by řádek roztrhaly.
function IkonaBtn({ title, onClick, children, cerveny = false }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button" title={title} aria-label={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 30, height: 30, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, cursor: 'pointer', transition: 'background .15s, color .15s, border-color .15s',
        border: `1px solid ${h && cerveny ? RED : LINE}`,
        background: h ? (cerveny ? 'rgba(193,18,31,.08)' : '#F4F5F7') : '#fff',
        color: cerveny ? RED : (h ? '#3a3f47' : '#9AA1AC'),
      }}
    >
      {children}
    </button>
  );
}

// Seznam položek (novinky, kempy, partneři, řádky tabulky…).
// Položky jsou SBALENÉ — v přehledu je vidět jen název a ovládání. Rozbalí se
// tužkou. Dřív byly všechny rozbalené naráz a stránka byla nepřehledná.
// Údaje, které vyplnil zákazník. Ve výchozím stavu se jen zobrazují — přepsat
// je jde až po kliknutí na tužku. Dřív se do nich dalo psát rovnou a omylem
// přepsat, co člověk skutečně poslal.
export function UdajeZakaznika({ polozky, upravovat, onUpravovat, children }) {
  if (upravovat) return children;
  return (
    <div style={{ position: 'relative', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', paddingRight: 40 }}>
        {polozky.filter((p) => p).map((p) => (
          <div key={p.label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', textTransform: 'uppercase' }}>{p.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: p.value ? '#1E1E1E' : '#C7CCD3', marginTop: 3, whiteSpace: 'pre-wrap' }}>{p.value || 'nevyplněno'}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <IkonaBtn title="Upravit údaje" onClick={onUpravovat} cerveny><Icon name="pencil" size={15} /></IkonaBtn>
      </div>
    </div>
  );
}

// Samostatný koš pro místa mimo seznam (např. smazání celého kempu).
export function IkonaKos({ title = 'Smazat', onClick }) {
  return <IkonaBtn title={title} onClick={onClick} cerveny><Icon name="trash" size={15} /></IkonaBtn>;
}

// Tužka pro rozbalení k úpravě mimo seznam (role, karty).
export function IkonaTuzka({ title = 'Upravit', onClick }) {
  return <IkonaBtn title={title} onClick={onClick} cerveny><Icon name="pencil" size={15} /></IkonaBtn>;
}

// `bezPridat` = tlačítko na přidání si sekce kreslí sama (v hlavičce vedle
// nadpisu), aby se k němu u dlouhého seznamu nemuselo scrollovat.
export function ListEditor({ items, onChange, newItem, renderItem, addLabel = '+ Přidat', itemTitle, bezPridat = false, otevriIndex = null, onOtevrenoPouzito }) {
  const [otevrene, setOtevrene] = useState(() => new Set());

  // Nově přidaná položka se rozbalí sama — jinak by se založila prázdná
  // a člověk by musel hledat, kde ji vyplnit.
  useEffect(() => {
    if (otevriIndex == null) return;
    setOtevrene((s) => new Set(s).add(otevriIndex));
    onOtevrenoPouzito?.();
  }, [otevriIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (i, patch) => {
    const next = items.slice();
    next[i] = typeof patch === 'function' ? patch(next[i]) : { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => {
    if (!confirm('Opravdu smazat tuto položku?')) return;
    onChange(items.filter((_, idx) => idx !== i));
    setOtevrene(new Set());
  };
  const move = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const next = items.slice(); [next[i], next[j]] = [next[j], next[i]]; onChange(next);
    setOtevrene(new Set());
  };
  const prepni = (i) => setOtevrene((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => {
        const open = otevrene.has(i);
        return (
        <Card key={i} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 12 : 0, gap: 10 }}>
            {/* Název drží jeden řádek; delší se ukončí třemi tečkami, aby
                ovládání vpravo nepodskočilo pod něj. */}
            <div
              onClick={() => prepni(i)}
              title={typeof (itemTitle ? itemTitle(item, i) : '') === 'string' ? itemTitle(item, i) : undefined}
              style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: '#3a3f47', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {itemTitle ? itemTitle(item, i) : `#${i + 1}`}
            </div>
            <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
              <IkonaBtn title="Posunout nahoru" onClick={() => move(i, -1)}>↑</IkonaBtn>
              <IkonaBtn title="Posunout dolů" onClick={() => move(i, 1)}>↓</IkonaBtn>
              <IkonaBtn title={open ? 'Sbalit' : 'Upravit'} onClick={() => prepni(i)} cerveny><Icon name="pencil" size={15} /></IkonaBtn>
              <IkonaBtn title="Smazat" onClick={() => remove(i)} cerveny><Icon name="trash" size={15} /></IkonaBtn>
            </div>
          </div>
          {open && renderItem(item, (patch) => update(i, patch), i)}
        </Card>
        );
      })}
      {!bezPridat && <div><Btn kind="primary" onClick={() => onChange([...items, typeof newItem === 'function' ? newItem() : { ...newItem }])}>{addLabel}</Btn></div>}
    </div>
  );
}

// Editor pole textových řetězců (hráči, položky, sponzoři).
export function StringListEditor({ items, onChange, placeholder = 'Nová položka', columns = 1 }) {
  const update = (i, v) => { const next = items.slice(); next[i] = v; onChange(next); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: 8, marginBottom: 10 }}>
        {items.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input value={v} onChange={(e) => update(i, e.target.value)} style={{ flex: 1, minWidth: 0, border: `1px solid ${LINE}`, background: '#FAFBFC', borderRadius: 10, padding: '9px 11px', fontSize: 14, fontFamily: 'Inter', outline: 'none' }} />
            <button onClick={() => remove(i)} title="Smazat" style={{ flex: 'none', width: 34, border: 'none', background: '#FBEAEC', color: RED, borderRadius: 10, cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        ))}
      </div>
      <Btn kind="ghost" small onClick={() => onChange([...items, ''])}>+ Přidat ({placeholder})</Btn>
    </div>
  );
}

// -----------------------------------------------------------------------------
//  ZPRÁVA ŽADATELI
//  Otevře se předvyplněná (potvrzení / zamítnutí), text jde dopsat a nic
//  neodejde bez kliknutí na Odeslat. Pod ní je historie toho, co už odešlo —
//  včetně neúspěchů, aby nevypadaly stejně jako doručené e-maily.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
//  STAV ODESÍLÁNÍ POŠTY
//  Bez tohohle se dalo poznat jen podle toho, že e-maily prostě nechodí.
//  Ukazuje, jestli je pošta napojená, z jaké adresy se posílá, a umí poslat
//  zkušební e-mail — klíč se nastavuje v proměnných prostředí, ne tady.
// -----------------------------------------------------------------------------
export function StavPosty({ vychoziEmail = '' }) {
  const [stav, setStav] = useState(null); // null = ještě se načítá
  const [komu, setKomu] = useState(vychoziEmail);
  const [odesilam, setOdesilam] = useState(false);
  const [vysledek, setVysledek] = useState(null); // { ok, zprava }

  useEffect(() => {
    let zahozeno = false;
    fetch('/api/mail')
      .then((r) => r.json())
      .then((d) => { if (!zahozeno) setStav(d); })
      .catch(() => { if (!zahozeno) setStav({ configured: false, from: '', error: 'Stav se nepodařilo zjistit — server neodpověděl.' }); });
    return () => { zahozeno = true; };
  }, []);

  // Adresu z nastavení převezmeme jen dokud si ji člověk sám nepřepsal.
  useEffect(() => { setKomu((k) => k || vychoziEmail); }, [vychoziEmail]);

  const poslat = async () => {
    if (!confirm(`Opravdu poslat zkušební e-mail na ${komu}?`)) return;
    setOdesilam(true); setVysledek(null);
    try {
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: komu }),
      });
      const data = await res.json().catch(() => ({}));
      setVysledek(res.ok
        ? { ok: true, zprava: `Odesláno na ${data.to || komu}. Když nedorazí, mrkni do spamu.` }
        : { ok: false, zprava: data.error || 'E-mail se nepodařilo odeslat.' });
    } catch {
      setVysledek({ ok: false, zprava: 'Server je nedostupný. Zkus to prosím znovu.' });
    } finally {
      setOdesilam(false);
    }
  };

  const nacita = stav === null;
  const ok = !!(stav && stav.configured);
  const barva = nacita ? '#9AA1AC' : ok ? '#1F8A4C' : RED;

  return (
    <Card style={{ marginBottom: 16, background: '#FAFBFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: barva, flex: 'none' }} />
        <span style={{ fontWeight: 800, fontSize: 14 }}>Odesílání e-mailů</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: barva }}>
          {nacita ? 'zjišťuje se…' : ok ? 'připojeno' : 'nefunguje'}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginTop: 8, lineHeight: 1.6 }}>
        {nacita && 'Načítám stav…'}
        {!nacita && ok && <>Posílá se z adresy <b>{stav.from}</b>. Upozornění na poptávky i odpovědi žadatelům odcházejí.</>}
        {!nacita && !ok && <>{stav.error || 'Pošta není nastavená.'} E-maily se neposílají — poptávky se ale do administrace ukládají vždycky.</>}
        <div style={{ marginTop: 4, color: '#9AA1AC' }}>
          Nastavuje se v proměnných prostředí <b>RESEND_API_KEY</b> a <b>MAIL_FROM</b> (v clusteru secret <b>fk-kunice-secrets</b>), ne v administraci.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Zkušební e-mail na adresu" value={komu} onChange={setKomu} placeholder="jmeno@example.cz" width="260px" />
        <Btn small kind="primary" onClick={poslat}>{odesilam ? 'Odesílám…' : 'Poslat zkušební e-mail'}</Btn>
        {vysledek && (
          <span style={{ fontSize: 12, fontWeight: 700, color: vysledek.ok ? '#1F8A4C' : RED, paddingBottom: 10 }}>{vysledek.zprava}</span>
        )}
      </div>
    </Card>
  );
}

export function ZpravaZadateli({ typ, id, email, predvyplneno, onZavrit, historie = [], onOdeslano }) {
  const [subject, setSubject] = useState(predvyplneno?.subject || '');
  const [text, setText] = useState(predvyplneno?.text || '');
  const [stav, setStav] = useState(null); // { ok, zprava }
  const [odesilam, setOdesilam] = useState(false);

  const odeslat = async () => {
    setOdesilam(true); setStav(null);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typ, id, subject, text }),
      });
      const data = await res.json().catch(() => ({}));
      const uspech = res.ok;
      setStav(uspech
        ? { ok: true, zprava: `Odesláno na ${data.to || email}.` }
        : { ok: false, zprava: data.error || 'E-mail se nepodařilo odeslat.' });
      // Historii zapsal server. Promítneme ji i sem, aby bylo hned vidět, co
      // se stalo — jinak by se objevila až po načtení stránky.
      onOdeslano?.({
        at: new Date().toISOString(), to: email, subject, text,
        ok: uspech, error: uspech ? '' : (data.error || ''),
      });
    } catch {
      setStav({ ok: false, zprava: 'Server je nedostupný. Zkus to prosím znovu.' });
    } finally {
      setOdesilam(false);
    }
  };

  if (!email) {
    return (
      <Card style={{ marginTop: 12, background: '#FAFBFC' }}>
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
          U záznamu není e-mail, takže odepsat nejde. Doplň ho v údajích výš.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 12, background: '#FAFBFC' }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Zpráva pro {email}</div>
      <Field label="Předmět" value={subject} onChange={setSubject} />
      <div style={{ height: 10 }} />
      <Field label="Text" textarea rows={8} value={text} onChange={setText} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn small kind="primary" onClick={odeslat}>{odesilam ? 'Odesílám…' : 'Odeslat'}</Btn>
        {onZavrit && <Btn small onClick={onZavrit}>Zavřít</Btn>}
        {stav && (
          <span style={{ fontSize: 12, fontWeight: 700, color: stav.ok ? '#1F8A4C' : '#C1121F' }}>{stav.zprava}</span>
        )}
      </div>

      {historie.length > 0 && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', textTransform: 'uppercase', marginBottom: 8 }}>Odeslané zprávy</div>
          {historie.map((z, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 800, color: z.ok ? '#1F8A4C' : '#C1121F', flex: 'none' }}>{z.ok ? 'odesláno' : 'neodesláno'}</span>
              <span style={{ color: '#9AA1AC', flex: 'none' }}>{String(z.at || '').slice(0, 16).replace('T', ' ')}</span>
              <span style={{ color: '#3a3f47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.subject}</span>
              {!z.ok && z.error && <span style={{ color: '#C1121F' }}>— {z.error}</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
