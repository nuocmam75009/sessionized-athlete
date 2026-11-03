# Tests du front athlète

Mise en œuvre du plan de tests (identifiants T01–T19). Chaque test porte l'identifiant du cas qu'il couvre dans son nom, pour retrouver un cas du plan dans le code et dans les rapports d'exécution.

## Lancer les tests

| Commande | Niveau | Durée |
|---|---|---|
| `npm test` | Unitaire + intégration (Vitest) | ~15 s |
| `npm run test:unit` | Unitaire seul (jsdom) | |
| `npm run test:integration` | Intégration seule (Node + MSW) | |
| `npm run test:coverage` | Vitest avec couverture (rapport dans `coverage/`) | |
| `npm run test:e2e` | Système, sécurité, accessibilité (Playwright) | ~1 min 30 avec le build |

Première installation de Playwright : `npx playwright install chromium`.

## Niveaux et outils

| Niveau | Outil | Où | Ce qui est testé |
|---|---|---|---|
| Unitaire | Vitest + Testing Library (jsdom) | `src/**/*.test.ts(x)`, à côté du code | Fonctions de `lib/`, composants client (`UploadView`, `LoginView`, `WorkoutModal`) |
| Intégration | Vitest + MSW (Node) | `tests/integration/` | Route Handlers `/api/*` et `proxy.ts`, avec le backend NestJS simulé |
| Système | Playwright | `tests/e2e/` | L'application buildée, de bout en bout dans Chromium |
| Sécurité | Vitest + Playwright | `redirect.test.ts`, `activities-id.test.ts`, `proxy.test.ts`, `security.spec.ts`, `auth.spec.ts` | Redirection ouverte, traversée de chemin, IDOR, XSS stockée, session expirée |
| Accessibilité | `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` | Chaque page, thèmes clair et sombre, WCAG 2.1 A/AA |

Les Server Components asynchrones (`dashboard/page.tsx`…) ne se testent pas avec Vitest. Leur logique est extraite dans `lib/` (ex. `parseMonthParam`) et la page entière est couverte par Playwright.

## Environnement de tests

- **Unitaire et intégration** : aucune dépendance externe. `API_URL` est fixé à `http://api.test` dans `vitest.config.mts`, et toute requête non déclarée par le test le fait échouer (`onUnhandledFrame: 'error'`). `cookies()` de `next/headers` est remplacé par un faux magasin (`tests/integration/support/cookies.ts`).
- **Système** : `playwright.config.ts` démarre deux serveurs :
  - `tests/e2e/mock-api/server.ts` sur le port **4010**. C'est une API simulée qui reprend les routes, les formes de réponse et les messages d'erreur de `sessionized-api`, sur des données en mémoire.
  - le **build de production** du front (`next build && next start`) sur le port **3100**, branché sur cette API.

  En local, un serveur déjà lancé sur ces ports est réutilisé. En CI (`CI=1`), tout est reconstruit.
- **Comptes de test** (mot de passe `Passw0rd!`) : `athlete@`, `uploader@`, `duplicate@`, `strava@`, `other@` et `coach@test.dev`. Il y a un compte par scénario, pour que les tests parallèles ne se gênent pas.
- **Réseau** : toute requête hors de `localhost` est bloquée pendant les tests système (`tests/e2e/fixtures.ts`).
- **Recette manuelle sur données fictives** : lancer `npm run mock-api`, puis `API_URL=http://localhost:4010 npm run dev`.

## Traçabilité plan → tests

| ID | Cas | Niveau(x) | Fichier(s) |
|---|---|---|---|
| T01 | Connexion valide, cookie HttpOnly | Intégration, système | `auth-login.test.ts`, `LoginView.test.tsx`, `auth.spec.ts` |
| T02 | Mot de passe erroné, message générique | Unitaire, intégration, système | `LoginView.test.tsx`, `auth-login.test.ts`, `auth.spec.ts` |
| T03 | Compte coach → app coach | Système | `auth.spec.ts` |
| T04 | `?redirect=//evil.example`, `/\evil.example` | Unitaire, système | `redirect.test.ts`, `LoginView.test.tsx`, `auth.spec.ts` |
| T05 | `/dashboard` sans cookie | Intégration, système | `proxy.test.ts`, `auth.spec.ts` |
| T06 | JWT expiré | Unitaire, intégration, système | `jwt.test.ts`, `proxy.test.ts`, `auth.spec.ts` |
| T07 | `?month=2026-13`, `?month=abc` | Unitaire, système | `calendar.test.ts`, `calendar.spec.ts` |
| T08 | Séance passée sans activité → `missed` | Unitaire | `calendar.test.ts` |
| T09 | Import d'un `.fit` valide | Unitaire, intégration, système | `UploadView.test.tsx`, `activities-upload.test.ts`, `upload.spec.ts` |
| T10 | Même `.fit` deux fois → 409 affiché | Unitaire, intégration, système | idem |
| T11 | `.gpx` seul | Unitaire | `UploadView.test.tsx` |
| T12 | Trois fichiers | Unitaire | `UploadView.test.tsx` |
| T13 | `.exe` renommé en `.fit` | Unitaire, intégration, système | `UploadView.test.tsx`, `activities-upload.test.ts`, `upload.spec.ts` |
| T14 | Activité d'un autre athlète → 404 | Intégration, système | `activities-id.test.ts`, `security.spec.ts` |
| T15 | `..%2Fusers%2Fme` → 400 | Unitaire, intégration, système | `utils.test.ts`, `activities-id.test.ts`, `security.spec.ts` |
| T16 | XSS stockée dans le titre d'une séance | Unitaire, système | `WorkoutModal.test.tsx`, `calendar.spec.ts` |
| T17 | Strava connecté → activités sur leur jour | Système (API simulée) | `calendar.spec.ts` |
| T18 | 0 violation axe *serious*/*critical* | Système | `a11y.spec.ts` |
| T19 | Charge (50 utilisateurs, `GET /activities`) | — | Hors périmètre du front : relève de l'API (k6) |

**Limites de l'API simulée.** Elle fixe le contrat que le front attend, sans prouver le comportement réel du backend. Le contrôle d'accès réel (T14), le parsing d'un vrai `.fit` (jeu d'essai) et la charge (T19) se testent dans `sessionized-api` (Jest + Supertest, k6). T17 avec un vrai compte Strava relève de la recette.
