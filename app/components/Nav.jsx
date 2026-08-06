'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hov } from './ui';

const NAV = [
  ['Domů', '/'],
  ['Týmy', '/tymy'],
  ['Zápasy', '/zapasy'],
  ['Kempy', '/kempy'],
  ['Pronájem', '/pronajem'],
  ['Novinky', '/novinky'],
  ['Kontakt', '/kontakt'],
];

// Postavička = vstup do vlastního účtu. Zámek působil spíš jako „sem nesmíš",
// tohle čte člověk jako přihlášení. Kreslená, ne obrázek — nemá co načítat
// a barvu bere z rodiče, takže reaguje na najetí myší spolu s ním.
function IkonaUcet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <nav style={{ position: 'fixed', top: 18, left: 0, right: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '0 20px', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 1200, position: 'relative' }}>
        <div style={{ background: 'rgba(12,12,14,.92)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 8px 30px rgba(0,0,0,.45)', borderRadius: 10, padding: '0 14px 0 16px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
          <Link href="/" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 'none' }}>
            <div style={{ width: 44, height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.svg" alt="FK Kunice 1934" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.5))' }} />
            </div>
            <div style={{ lineHeight: 1.04 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 17, letterSpacing: '.4px', color: '#fff' }}>FK KUNICE</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,.5)' }}>EST. 1934</div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }} className="fk-navlinks">
            {NAV.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Hov
                  key={href}
                  as={Link}
                  href={href}
                  style={`font-size:13.5px;font-weight:600;letter-spacing:.2px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:background .2s,color .2s;${active ? 'color:#FF4D57;background:rgba(214,40,57,.16)' : 'color:rgba(255,255,255,.82)'}`}
                  hover={active ? undefined : 'background:rgba(255,255,255,.1);color:#fff'}
                >
                  {label}
                </Hov>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            {/* Administrace jen ikonou — návštěvníka klubu nezajímá a v menu
                mezi Domů/Týmy/Zápasy jen překážela. `aria-label` a `title`
                drží přístupnost i nápovědu při najetí. */}
            <Hov as={Link} href="/admin" className="fk-navlinks" aria-label="Přihlášení do administrace" title="Přihlášení do administrace"
              style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;color:rgba(255,255,255,.6);cursor:pointer;border-radius:10px"
              hover="color:#fff;background:rgba(255,255,255,.1)">
              <IkonaUcet />
            </Hov>
            <Hov as={Link} href="/kontakt" style="font-size:14px;font-weight:700;color:#fff;background:#C1121F;padding:11px 19px;border-radius:10px;cursor:pointer;box-shadow:0 8px 20px rgba(193,18,31,.32);transition:transform .2s,box-shadow .2s,background .2s" hover="transform:translateY(-2px);box-shadow:0 12px 26px rgba(193,18,31,.45);background:#D62839;color:#fff">Přidej se</Hov>
            {/* Hamburger — pouze mobil (zobrazeno přes .fk-burger v CSS) */}
            <button className="fk-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 10, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', cursor: 'pointer', flex: 'none' }}>
              <span style={{ position: 'relative', width: 18, height: 12, display: 'inline-block' }}>
                <span style={{ position: 'absolute', left: 0, right: 0, top: open ? 5 : 0, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'rotate(45deg)' : 'none' }} />
                <span style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 2, background: '#fff', borderRadius: 2, transition: 'opacity .2s', opacity: open ? 0 : 1 }} />
                <span style={{ position: 'absolute', left: 0, right: 0, top: open ? 5 : 10, height: 2, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'rotate(-45deg)' : 'none' }} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobilní rozbalovací menu */}
        {open && (
          <div style={{ marginTop: 10, background: 'rgba(10,10,12,.94)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 18px 40px rgba(0,0,0,.5)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} style={{ fontSize: 15, fontWeight: 600, padding: '12px 14px', borderRadius: 10, color: active ? '#FF4D57' : 'rgba(255,255,255,.82)', background: active ? 'rgba(214,40,57,.16)' : 'transparent' }}>{label}</Link>
              );
            })}
            <Link href="/admin" onClick={() => setOpen(false)} aria-label="Přihlášení do administrace" title="Přihlášení do administrace"
              style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 10, color: 'rgba(255,255,255,.6)', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 4 }}>
              <IkonaUcet />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
