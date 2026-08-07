import './globals.css';
import Ramec from './components/Ramec';
import { ContentProvider } from '@/lib/store';
import { SessionProvider } from '@/lib/session';

export const metadata = {
  // Ostrá adresa webu. Z ní se odvozují absolutní odkazy v náhledech pro
  // sociální sítě — dokud tu byla stará testovací adresa, náhledy ukazovaly
  // na web, který už neexistuje.
  metadataBase: new URL('https://www.fkkunice.cz'),
  title: {
    default: 'FK Kunice 1934 — Společně silnější',
    template: '%s · FK Kunice 1934',
  },
  description:
    'Oficiální web fotbalového klubu FK Kunice 1934. Týmy a soupisky, zápasy, letní kempy, pronájem areálu a novinky ze života klubu.',
  keywords: ['FK Kunice', 'fotbal Kunice', 'fotbalový klub', 'letní kemp', 'pronájem hřiště', 'nábor dětí fotbal'],
  openGraph: {
    title: 'FK Kunice 1934 — Společně silnější',
    description: 'Moderní fotbalová akademie pro děti, mládež i dospělé ve Středočeském kraji.',
    type: 'website',
    locale: 'cs_CZ',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#121212',
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>
        <ContentProvider>
          <SessionProvider>
            {/* menu + patička na webu, úzký pruh v administraci */}
            <Ramec>{children}</Ramec>
          </SessionProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
