/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vlastní složka pro sestavený kód. E2E testy si ji přepínají na `.next-e2e`,
  // aby nešláply na `.next` běžícího vývojového serveru — jinak si oba procesy
  // navzájem mažou soubory a padá to na „Cannot find module './379.js'".
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Pro běh v kontejneru. Next vygeneruje `.next/standalone/server.js` s jen
  // těmi závislostmi, které se opravdu volají — obraz je pak řádově menší
  // a nepotřebuje ani `next start`, ani celé `node_modules`.
  // Vercel tohle nastavení ignoruje, takže nasazení tam se nemění.
  output: 'standalone',
};

export default nextConfig;
