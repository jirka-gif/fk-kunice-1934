'use client';
// =============================================================================
//  PROHLÍŽEČ FOTEK — galerie na klik přes celou obrazovku
//  Dlaždice v galerii byly dosud jen ozdoba: klikly, ale nic neotevřely.
//  Tohle je otevře přes celou obrazovku, dá se listovat šipkami i klávesnicí
//  a zavře se křížkem, klávesou Esc nebo kliknutím vedle fotky.
// =============================================================================
import { useEffect } from 'react';

export function ProhlizecFotek({ fotky, index, onZavrit, onZmenit }) {
  const otevreno = index != null && index >= 0 && fotky[index];

  // Klávesnice: Esc zavře, šipky listují. Zároveň zamkneme rolování stránky,
  // aby se pod prohlížečem neposouval obsah.
  useEffect(() => {
    if (!otevreno) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onZavrit();
      if (e.key === 'ArrowRight') onZmenit((index + 1) % fotky.length);
      if (e.key === 'ArrowLeft') onZmenit((index - 1 + fotky.length) % fotky.length);
    };
    const puvodni = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = puvodni;
    };
  }, [otevreno, index, fotky.length, onZavrit, onZmenit]);

  if (!otevreno) return null;
  const fotka = fotky[index];

  const sipka = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 46, height: 46,
    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999,
    border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.45)', color: '#fff',
    fontSize: 20, cursor: 'pointer', userSelect: 'none',
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Prohlížeč fotek"
      onClick={onZavrit}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,6,8,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <button
        type="button" onClick={onZavrit} aria-label="Zavřít"
        style={{ position: 'absolute', top: 18, right: 18, width: 42, height: 42, borderRadius: 999, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 20, cursor: 'pointer' }}
      >
        ×
      </button>

      {fotky.length > 1 && (
        <>
          <button type="button" aria-label="Předchozí fotka" style={{ ...sipka, left: 18 }}
            onClick={(e) => { e.stopPropagation(); onZmenit((index - 1 + fotky.length) % fotky.length); }}>‹</button>
          <button type="button" aria-label="Další fotka" style={{ ...sipka, right: 18 }}
            onClick={(e) => { e.stopPropagation(); onZmenit((index + 1) % fotky.length); }}>›</button>
        </>
      )}

      {/* Klik na samotnou fotku prohlížeč nezavírá — zavírá jen okolí. */}
      <figure onClick={(e) => e.stopPropagation()} style={{ margin: 0, maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <img
          src={fotka.image} alt={fotka.alt || ''}
          style={{ maxWidth: '92vw', maxHeight: fotka.alt ? '78vh' : '84vh', objectFit: 'contain', borderRadius: 10, display: 'block', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}
        />
        <figcaption style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          {fotka.alt}
          {fotky.length > 1 && <span style={{ color: 'rgba(255,255,255,.45)', marginLeft: fotka.alt ? 10 : 0 }}>{index + 1} / {fotky.length}</span>}
        </figcaption>
      </figure>
    </div>
  );
}
