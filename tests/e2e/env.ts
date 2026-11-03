// Ports dédiés aux tests système : ne pas entrer en collision avec `next dev`
// (3000), l'API réelle (3001) ou l'app coach. Partagés par playwright.config.ts
// et les tests.
export const APP_PORT = 3100

// L'app coach n'est pas démarrée : les tests interceptent cette origine.
export const COACH_APP_URL = 'http://localhost:3101'
