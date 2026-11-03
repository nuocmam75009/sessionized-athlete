import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Deux projets, un par niveau du plan de tests (voir tests/README.md) :
// - unit : fonctions de lib/ et composants client, dans un DOM simulé (jsdom) ;
// - integration : Route Handlers et proxy exécutés en Node, backend NestJS
//   simulé par MSW.
// Les tests système (Playwright) vivent dans tests/e2e et ne passent pas par Vitest.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Fixées ici plutôt que lues dans .env : les tests ne doivent jamais
    // dépendre de la configuration locale du développeur, ni joindre la vraie API.
    env: {
      API_URL: 'http://api.test',
      NEXT_PUBLIC_COACH_APP_URL: 'http://coach.test',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/types/**'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup/unit.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['tests/setup/integration.ts'],
        },
      },
    ],
  },
})
