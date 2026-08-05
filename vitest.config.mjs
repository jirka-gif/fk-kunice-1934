// Konfigurace unit / integračních testů (Vitest).
// E2E testy (Playwright) běží zvlášť ze složky e2e/ — tady je vynecháváme.
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd()) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
});
