'use client';
import { useState } from 'react';
import { css, COLORS } from '@/lib/design';

// Element s hover/focus stylem (nahrazuje style-hover/style-focus z návrhu).
// style/hover/focus přijímají buď string ("a:b;c:d") nebo již hotový objekt.
export function Hov({ as = 'div', style, hover, focus, children, ...rest }) {
  const [h, setH] = useState(false);
  const [f, setF] = useState(false);
  const El = as;
  const base = typeof style === 'string' ? css(style) : style || {};
  const hov = typeof hover === 'string' ? css(hover) : hover || {};
  const foc = typeof focus === 'string' ? css(focus) : focus || {};
  return (
    <El
      style={{ ...base, ...(h ? hov : {}), ...(f ? foc : {}) }}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => setH(false)}
      onPointerLeave={() => setH(false)}
      onFocus={focus ? () => setF(true) : undefined}
      onBlur={() => setF(false)}
      {...rest}
    >
      {children}
    </El>
  );
}

// Sekční nadpis s červenou linkou (eyebrow + h2)
export function Eyebrow({ children, center = false, color = COLORS.red, dark = false }) {
  return (
    <div style={{ display: center ? 'inline-flex' : 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ width: 28, height: 3, background: COLORS.red, borderRadius: 2 }} />
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', color: dark ? COLORS.redBright : color }}>{children}</span>
      {center && <span style={{ width: 28, height: 3, background: COLORS.red, borderRadius: 2 }} />}
    </div>
  );
}

export function H2({ children, color = COLORS.ink }) {
  return (
    <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(40px,5.4vw,68px)', lineHeight: 1.12, textTransform: 'uppercase', letterSpacing: '.5px', color }}>
      {children}
    </h2>
  );
}
