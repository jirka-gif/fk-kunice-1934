/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vlastní složka pro sestavený kód. E2E testy si ji přepínají na `.next-e2e`,
  // aby nešláply na `.next` běžícího vývojového serveru — jinak si oba procesy
  // navzájem mažou soubory a padá to na „Cannot find module './379.js'".
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
