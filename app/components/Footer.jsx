'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Hov } from './ui';
import { Icon } from './icons';
import { useContent } from '@/lib/store';

const LINKS_A = [['Týmy', '/tymy'], ['Zápasy', '/zapasy'], ['Novinky', '/novinky'], ['Galerie', '/'], ['Historie', '/']];
const LINKS_B = [['Letní kempy', '/kempy'], ['Pronájem areálu', '/pronajem'], ['Nábor dětí', '/kontakt'], ['Admin / CMS', '/admin']];

function Ig() { return (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={2} width={20} height={20} rx={5} /><circle cx={12} cy={12} r={4} /><circle cx={17.5} cy={6.5} r={1} /></svg>); }
function Fb() { return (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>); }
function Tw() { return (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.6a8.4 8.4 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.8A11.7 11.7 0 0 1 3 6.1a4.1 4.1 0 0 0 1.3 5.5 4 4 0 0 1-1.9-.5v.05a4.1 4.1 0 0 0 3.3 4 4.1 4.1 0 0 1-1.8.07 4.1 4.1 0 0 0 3.8 2.8A8.3 8.3 0 0 1 2 19.5a11.7 11.7 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5A8.3 8.3 0 0 0 22 8.6z" /></svg>); }

export default function Footer() {
  const { club } = useContent();
  return (
    <footer style={{ background: '#0c0c0e', color: '#fff', padding: '84px 0 34px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 60% at 8% 0%,rgba(193,18,31,.16),transparent 58%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <div className="fk-foot-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 44, paddingBottom: 50, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 22 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flex: 'none' }}>
                <Image src="/logo.webp" alt="FK Kunice 1934" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '.5px' }}>FK KUNICE</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,.5)' }}>EST. 1934</div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, lineHeight: 1.65, maxWidth: 320 }}>{club.description}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {[<Ig key="i" />, <Fb key="f" />, <Tw key="t" />].map((ic, i) => (
                <Hov key={i} style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .25s" hover="background:#C1121F">{ic}</Hov>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.42)', marginBottom: 18 }}>KLUB</div>
            {LINKS_A.map(([label, href]) => (
              <Hov key={label + href} as={Link} href={href} style="color:rgba(255,255,255,.7);font-size:14px;font-weight:500;margin-bottom:13px;cursor:pointer;transition:color .2s;display:block" hover="color:#fff">{label}</Hov>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.42)', marginBottom: 18 }}>SLUŽBY</div>
            {LINKS_B.map(([label, href]) => (
              <Hov key={label + href} as={Link} href={href} style="color:rgba(255,255,255,.7);font-size:14px;font-weight:500;margin-bottom:13px;cursor:pointer;transition:color .2s;display:block" hover="color:#fff">{label}</Hov>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,.42)', marginBottom: 18 }}>KONTAKT</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, fontWeight: 500, lineHeight: 1.75 }}>
              Areál FK Kunice<br />{club.address.street}, {club.address.zip}<br />{club.email}<br />{club.phone}
            </div>
            <Link href="/kontakt" style={{ marginTop: 18, height: 120, borderRadius: 14, background: 'linear-gradient(135deg,#241112,#120a0b)', border: '1px solid rgba(255,255,255,.1)', position: 'relative', overflow: 'hidden', cursor: 'pointer', display: 'block' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Icon name="pin" size={22} color="rgba(255,255,255,.85)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>Zobrazit mapu</span>
              </div>
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 500 }}>© 2026 FK Kunice 1934. Všechna práva vyhrazena.</span>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 600, fontFamily: "'Bebas Neue'", letterSpacing: '1px' }}>SPOLEČNĚ SILNĚJŠÍ.</span>
        </div>
      </div>
    </footer>
  );
}
