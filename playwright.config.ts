import { defineConfig, devices } from '@playwright/test'
import { APP_PORT, COACH_APP_URL } from './tests/e2e/env'
import { MOCK_API_PORT } from './tests/e2e/mock-api/server'

// Environnement des tests système : le build de production du front (comme le
// recommande le guide Next.js), branché sur l'API simulée. Les variables sont
// passées explicitement pour ne jamais hériter du .env du développeur.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // 5 s par défaut ne suffisent pas au démarrage de la suite : tous les
  // navigateurs se lancent en même temps et la première connexion a mesuré
  // jusqu'à 7 s, contre 40 ms une fois le serveur chaud.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    // L'app suit l'Accept-Language du navigateur, que Playwright tire par
    // défaut de la langue du système : sur un poste francophone, toute la
    // suite passerait en français. Fixée ici, elle vaut partout ; les tests de
    // langue (i18n.spec.ts) la changent explicitement.
    locale: 'en-US',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run mock-api',
      url: `http://localhost:${MOCK_API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // En local, un serveur déjà lancé sur ce port est réutilisé (pas de
      // rebuild) : penser à le relancer après une modification de src/.
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        API_URL: `http://localhost:${MOCK_API_PORT}`,
        NEXT_PUBLIC_COACH_APP_URL: COACH_APP_URL,
        COOKIE_DOMAIN: '',
      },
    },
  ],
})
