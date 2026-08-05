'use client';
// =============================================================================
//  RÁMEC WEBU — co se zobrazí kolem obsahu
//  Veřejný web: hlavní menu + patička + plovoucí přepínač úprav textů.
//  Administrace: hlavní menu tam jen překáží, proto je nahrazené úzkým pruhem
//  (zpátky na web, kdo je přihlášený, tužka pro úpravy textů přímo na webu).
// =============================================================================
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Nav from './Nav';
import Footer from './Footer';
import { PrepinacUprav } from './Text';
import { useSession } from '@/lib/session';

const RED = '#C1121F';

export default function Ramec({ children }) {
  const path = usePathname() || '';
  const jeAdmin = path.startsWith('/admin');

  if (jeAdmin) {
    return (
      <>
        <PruhAdmin />
        <main className="fk-min">{children}</main>
      </>
    );
  }
  return (
    <>
      <Nav />
      <main className="fk-min">{children}</main>
      <Footer />
      <PrepinacUprav />
    </>
  );
}

function PruhAdmin() {
  const { user } = useSession();
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, height: 52, background: 'rgba(12,12,14,.94)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 18px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
        ← Zpět na web
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user && (
          <Link
            href="/?upravy=1"
            title="Upravit texty a fotky přímo na webu"
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: '#fff', background: RED, padding: '8px 13px', borderRadius: 9 }}
          >
            <Tuzka /> Upravit web
          </Link>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: user ? 'rgba(255,255,255,.72)' : 'rgba(255,255,255,.45)' }}>
          {user ? `Přihlášen(a): ${user.name || user.email}` : 'Nepřihlášen(a)'}
        </span>
      </div>
    </div>
  );
}

function Tuzka() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
