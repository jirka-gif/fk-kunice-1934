'use client';
// Rozbalovací nabídka v klubovém stylu — bílé pozadí, červeně vybraná položka,
// jemně červená pod myší. Nativní <select> to napříč prohlížeči nakreslit neumí,
// proto vlastní komponenta. Ovládá se i klávesnicí a zavře se kliknutím vedle.
import { useEffect, useRef, useState } from 'react';

const RED = '#C1121F';
const LINE = '#ECEEF1';

// `sevrene` = admin: nižší řádek a světlejší podklad, aby nabídka seděla vedle
// běžných polí. Web používá výchozí, vzdušnější rozměry.
export function Vyber({ value, onChange, options, placeholder = 'Vyber…', ariaLabel, sevrene = false }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(-1);
  const boxRef = useRef(null);

  const items = (options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = items.find((o) => o.value === value);

  // klik mimo nabídku ji zavře
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (v) => { onChange(v); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); return; }
    if (!open) return;
    const i = items.findIndex((o) => o.value === value);
    if (e.key === 'ArrowDown') { e.preventDefault(); pick(items[Math.min(items.length - 1, i + 1)]?.value ?? value); setOpen(true); }
    if (e.key === 'ArrowUp') { e.preventDefault(); pick(items[Math.max(0, i - 1)]?.value ?? value); setOpen(true); }
  };

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: sevrene && !open ? '#FAFBFC' : '#fff', border: `1px solid ${open ? RED : LINE}`, borderRadius: 10,
          padding: sevrene ? '11px 13px' : '14px 16px', fontSize: 14, fontWeight: 600, color: selected ? '#1E1E1E' : '#9AA1AC',
          cursor: 'pointer', outline: 'none', transition: 'border-color .2s, box-shadow .2s',
          boxShadow: open ? '0 2px 12px rgba(193,18,31,.14)' : (sevrene ? 'none' : '0 2px 8px rgba(18,18,18,.05)'),
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.label : placeholder}</span>
        <span aria-hidden="true" style={{ flex: 'none', color: RED, fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 18px 44px rgba(18,18,18,.16)', maxHeight: 260, overflowY: 'auto',
          }}
        >
          {items.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#9AA1AC' }}>Není z čeho vybírat.</div>
          )}
          {items.map((o, i) => {
            const on = o.value === value;
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={on}
                onClick={() => pick(o.value)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                style={{
                  padding: sevrene ? '10px 13px' : '13px 16px', fontSize: 14, fontWeight: on ? 800 : 600, cursor: 'pointer',
                  background: on ? RED : hover === i ? 'rgba(193,18,31,.08)' : '#fff',
                  color: on ? '#fff' : hover === i ? RED : '#3a3f47',
                  transition: 'background .15s, color .15s',
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
