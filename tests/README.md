# Tests du front athlète

Mise en œuvre du plan de tests (identifiants T01–T34). Chaque test porte l'identifiant du cas qu'il couvre dans son nom, pour retrouver un cas du plan dans le code et dans les rapports d'exécution.

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
| Sécurité | Vitest + Playwright | `redirect.test.ts`, `activities-id.test.ts`, `proxy.test.ts`, `server-api.test.ts`, `security.spec.ts`, `auth.spec.ts` | Redirection ouverte, traversée de chemin, IDOR, XSS stockée, session expirée ou refusée par l'API |
| Accessibilité | `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` | Chaque page, thèmes clair et sombre, en anglais et en français, WCAG 2.1 A/AA |

Les Server Components asynchrones (`dashboard/page.tsx`…) ne se testent pas avec Vitest. Leur logique est extraite dans `lib/` (ex. `parseMonthParam`) et la page entière est couverte par Playwright.

## Environnement de tests

- **Unitaire et intégration** : aucune dépendance externe. `API_URL` est fixé à `http://api.test` dans `vitest.config.mts`, et toute requête non déclarée par le test le fait échouer (`onUnhandledFrame: 'error'`). `cookies()` de `next/headers` est remplacé par un faux magasin (`tests/integration/support/cookies.ts`).
- **Système** : `playwright.config.ts` démarre deux serveurs :
  - `tests/e2e/mock-api/server.ts` sur le port **4010**. C'est une API simulée qui reprend les routes, les formes de réponse et les messages d'erreur de `sessionized-api`, sur des données en mémoire.
  - le **build de production** du front (`next build && next start`) sur le port **3100**, branché sur cette API.

  En local, un serveur déjà lancé sur ces ports est réutilisé. En CI (`CI=1`), tout est reconstruit.
- **Langue** : le navigateur de test est en `en-US` (`playwright.config.ts`), quelle que soit la langue du poste. Sans cela, Playwright reprend celle du système, et l'app, qui suit l'`Accept-Language`, passerait en français sur un poste francophone. Les tests de langue (`i18n.spec.ts`) choisissent le français explicitement (`chooseLocale`, ou `test.use({ locale: 'fr-FR' })`).
- **Comptes de test** (mot de passe `Passw0rd!`) : `athlete@`, `uploader@`, `duplicate@`, `strava@`, `strava-revoked@`, `other@`, `legacy@` et `legacy-audit@` (sans consentement aux données de santé), `deleter@` (supprimé par T25) et `coach@test.dev`. Il y a un compte par scénario, pour que les tests parallèles ne se gênent pas.
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
| T17 | Strava connecté → aucune sync au chargement ; « Sync Strava » → activités sur leur jour | Unitaire, système (API simulée) | `StravaSyncButton.test.tsx`, `calendar.spec.ts` |
| T18 | 0 violation axe *serious*/*critical* | Système | `a11y.spec.ts` |
| T19 | Charge (50 utilisateurs, `GET /activities`) | — | Hors périmètre du front : relève de l'API (k6) |
| T20 | Jeton non expiré refusé par l'API (401) → `/login` | Unitaire, intégration, système | `LoginView.test.tsx`, `server-api.test.ts`, `proxy.test.ts`, `auth.spec.ts` |
| T21 | Connexion Strava inutilisable (409) au clic sur « Sync Strava » → redirection vers le bouton de reconnexion | Unitaire, système | `StravaSyncButton.test.tsx`, `ProfileView.test.tsx`, `calendar.spec.ts` |
| T22 | `.fit` rattaché à une activité Strava : succès, 409, 400, autre erreur, rechargement en échec | Unitaire | `FitFileUpload.test.tsx` |
| T23 | Pages légales sans compte, liens sur chaque écran, consentement aux données de santé à l'inscription | Unitaire, système | `legal-pages.test.tsx`, `LoginView.test.tsx`, `legal.spec.ts`, `a11y.spec.ts` |
| T24 | Consentement transmis à l'API à l'inscription ; compte créé avant la case bloqué sur l'écran de consentement jusqu'à son accord | Unitaire, intégration, système | `LoginView.test.tsx`, `HealthConsentGate.test.tsx`, `users-me-privacy.test.ts`, `privacy-rights.spec.ts`, `a11y.spec.ts` |
| T25 | Export des données en JSON ; suppression du compte avec mot de passe (403 si faux), cookie effacé, connexion refusée ensuite | Unitaire, intégration, système | `AccountDataActions.test.tsx`, `LoginView.test.tsx`, `users-me-privacy.test.ts`, `privacy-rights.spec.ts` |
| T33 | Graphe d'allure d'une séance : laps situés sur la trace, répétitions d'un fractionné sélectionnées d'office, sélection depuis le tableau ou le graphe, totaux de la sélection, zoom | Unitaire, système | `pace-chart.test.ts`, `LapAnalysis.test.tsx`, `activity.spec.ts`, `a11y.spec.ts` |
| T34 | Langue de l'interface : anglais ou français selon le cookie de langue, sinon le navigateur ; la bascule traduit la page sans la recharger ni perdre la saisie, y compris les pages préchargées ; cookie `HttpOnly` d'un an ; dates et nombres au format de la langue ; erreurs de connexion traduites par la route ; pages légales et audit axe en français | Unitaire, intégration, système | `config.test.ts`, `LanguageToggle.test.tsx`, `utils.test.ts`, `calendar.test.ts`, `plan-format.test.ts`, `legal-pages.test.tsx`, `auth-login.test.ts`, `i18n.spec.ts`, `a11y.spec.ts` |

**Limites de l'API simulée.** Elle fixe le contrat que le front attend, sans prouver le comportement réel du backend. Le contrôle d'accès réel (T14), le parsing d'un vrai `.fit` (jeu d'essai) et la charge (T19) se testent dans `sessionized-api` (Jest + Supertest, k6). T17 avec un vrai compte Strava relève de la recette.
