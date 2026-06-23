'use client';
import { useState, useEffect } from 'react';

function calc(targetISO) {
  if (!targetISO) return null;
  const t = new Date(targetISO).getTime();
  if (Number.isNaN(t)) return null;
  let diff = Math.max(0, Math.floor((t - Date.now()) / 1000));
  const d = Math.floor(diff / 86400); diff -= d * 86400;
  const h = Math.floor(diff / 3600); diff -= h * 3600;
  const m = Math.floor(diff / 60); const s = diff - m * 60;
  return { d, h, m, s };
}

// Živý odpočet do zápasu. targetISO např. "2026-06-28T16:30".
// Renderuje se až po mountu (kvůli hydrataci) — proto null do prvního efektu.
export function Countdown({ targetISO }) {
  const [c, setC] = useState(null);
  useEffect(() => {
    setC(calc(targetISO));
    const id = setInterval(() => setC(calc(targetISO)), 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  if (!c) return null;
  const boxes = [{ n: c.d, l: 'DNÍ' }, { n: c.h, l: 'HODIN' }, { n: c.m, l: 'MINUT' }, { n: c.s, l: 'SEKUND' }];
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
      {boxes.map((b, i) => (
        <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 13, padding: '12px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,4vw,30px)', lineHeight: 1, color: '#fff' }}>{String(b.n).padStart(2, '0')}</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,.45)', marginTop: 5 }}>{b.l}</div>
        </div>
      ))}
    </div>
  );
}
