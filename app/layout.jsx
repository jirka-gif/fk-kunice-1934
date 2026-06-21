import './globals.css';
import Nav from './components/Nav';
import Footer from './components/Footer';
import { ContentProvider } from '@/lib/store';

export const metadata = {
  metadataBase: new URL('https://fk-kunice-1934.vercel.app'),
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
          <Nav />
          <main className="fk-min">{children}</main>
          <Footer />
        </ContentProvider>
      </body>
    </html>
  );
}
