// Konfigurace e2e testů (Playwright). Spouští se přes `npm run test:e2e`.
// Server si Playwright nastartuje sám na vlastním portu (3100), aby nekolidoval
// s běžícím vývojovým serverem na 3000 a měl vždy známé testovací heslo.
import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // Testovací prostředí: bez databáze (fallback do paměti) a se známým heslem.
      ADMIN_PASSWORD: 'test-heslo',
      AUTH_SECRET: 'test-secret',
      DATABASE_URL: '',
      POSTGRES_URL: '',
    },
  },
});
