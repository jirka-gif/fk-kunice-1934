'use client';
// Sdílená UI primitiva pro administraci FK Kunice.
import { useRef } from 'react';

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
    border: `1px solid ${LINE}`, background: '#FAFBFC', borderRadius: 11, padding: '11px 13px',
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

export function Select({ label, value, onChange, options, width }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label style={{ display: 'block', flex: width ? `0 0 ${width}` : 1, minWidth: 0 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>}
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ display: 'block', boxSizing: 'border-box', border: `1px solid ${LINE}`, background: '#FAFBFC', borderRadius: 11, padding: '11px 34px 11px 13px', fontSize: 14, fontFamily: 'Inter', lineHeight: 1.2, color: '#1E1E1E', outline: 'none', width: '100%', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239AA1AC' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px' }}>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// Přepínač týmů (chips) — sdílený pro sekce editovatelné po týmech.
export function TeamSwitcher({ teams, activeIndex, onSelect, badge }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
      {teams.map((tm, i) => {
        const active = i === activeIndex;
        return (
          <button key={tm.id} onClick={() => onSelect(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', border: active ? `1px solid ${RED}` : `1px solid ${LINE}`, background: active ? RED : '#fff', color: active ? '#fff' : '#3a3f47' }}>
            {tm.name}
            {badge != null && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{badge(tm)}</span>}
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
    <button type={type} onClick={onClick} style={{ ...styles, fontWeight: 700, fontSize: small ? 12 : 14, padding: small ? '7px 11px' : '11px 18px', borderRadius: 11, cursor: 'pointer', transition: 'filter .15s', whiteSpace: 'nowrap' }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(.95)')} onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 8px 24px rgba(18,18,18,.05)', ...style }}>{children}</div>;
}

export function SectionHead({ title, desc, count }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#121212', letterSpacing: '.3px' }}>{title}</div>
        {count != null && <span style={{ background: '#FBEAEC', color: RED, fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 99 }}>{count}</span>}
      </div>
      {desc && <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginTop: 4 }}>{desc}</div>}
    </div>
  );
}

// Editor pole objektů: přidat / smazat / přesunout. `renderItem(item, update, index)`.
export function ListEditor({ items, onChange, newItem, renderItem, addLabel = '+ Přidat', itemTitle }) {
  const update = (i, patch) => {
    const next = items.slice();
    next[i] = typeof patch === 'function' ? patch(next[i]) : { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => { if (confirm('Opravdu smazat tuto položku?')) onChange(items.filter((_, idx) => idx !== i)); };
  const move = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const next = items.slice(); [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <Card key={i} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#9AA1AC' }}>{itemTitle ? itemTitle(item, i) : `#${i + 1}`}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn small onClick={() => move(i, -1)}>↑</Btn>
              <Btn small onClick={() => move(i, 1)}>↓</Btn>
              <Btn small kind="danger" onClick={() => remove(i)}>Smazat</Btn>
            </div>
          </div>
          {renderItem(item, (patch) => update(i, patch), i)}
        </Card>
      ))}
      <div><Btn kind="primary" onClick={() => onChange([...items, typeof newItem === 'function' ? newItem() : { ...newItem }])}>{addLabel}</Btn></div>
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
