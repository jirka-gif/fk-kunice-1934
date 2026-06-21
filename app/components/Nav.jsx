'use client';
import Link from 'next/link';
import Image from 'next/image';
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

export default function Nav() {
  const path = usePathname();
  const isActive = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <nav style={{ position: 'fixed', top: 18, left: 0, right: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '0 20px', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 1200, background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,.6)', boxShadow: '0 8px 30px rgba(18,18,18,.12)', borderRadius: 20, padding: '0 14px 0 16px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1px solid #ECEEF1', boxShadow: '0 4px 12px rgba(18,18,18,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, flex: 'none' }}>
            <Image src="/logo.webp" alt="FK Kunice 1934" width={44} height={44} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ lineHeight: 1.04 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 17, letterSpacing: '.4px', color: '#121212' }}>FK KUNICE</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: '#9AA1AC' }}>EST. 1934</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="fk-navlinks">
          {NAV.map(([label, href]) => {
            const active = isActive(href);
            return (
              <Hov
                key={href}
                as={Link}
                href={href}
                style={`font-size:13.5px;font-weight:600;letter-spacing:.2px;padding:9px 12px;border-radius:11px;cursor:pointer;transition:background .2s,color .2s;${active ? 'color:#C1121F;background:rgba(193,18,31,.08)' : 'color:#3a3f47'}`}
                hover={active ? undefined : 'background:#F0F1F4;color:#121212'}
              >
                {label}
              </Hov>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <Hov as={Link} href="/admin" style="font-size:13px;font-weight:600;color:#6B7280;cursor:pointer;padding:9px 11px;border-radius:11px" hover="color:#121212;background:#F0F1F4">Admin</Hov>
          <Hov as={Link} href="/kontakt" style="font-size:14px;font-weight:700;color:#fff;background:#C1121F;padding:11px 19px;border-radius:13px;cursor:pointer;box-shadow:0 8px 20px rgba(193,18,31,.32);transition:transform .2s,box-shadow .2s,background .2s" hover="transform:translateY(-2px);box-shadow:0 12px 26px rgba(193,18,31,.45);background:#D62839;color:#fff">Přidej se</Hov>
        </div>
      </div>
    </nav>
  );
}
