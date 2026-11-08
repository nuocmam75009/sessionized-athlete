@AGENTS.md

# Sessionized — front athlète, contexte pour Claude Code

Lis ce fichier avant de générer du code. Il décrit l'état réel du dépôt au 08/11/2026.

---

## Vue d'ensemble

Sessionized est une plateforme de coaching sportif (course à pied) :

- **sessionized-athlete** (ce dépôt) : app Next.js de l'athlète ;
- **sessionized-api** : backend NestJS, documenté dans `sessionized-api/README.md` ;
- **sessionized-coach** : app Next.js du coach, hors du périmètre du projet présenté.

## Stack

| Élément | Choix |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts` à la place de `middleware.ts`) |
| Langage | TypeScript strict, React 19 |
| Style | Tailwind CSS 4, jetons de thème dans `src/app/globals.css` (clair et sombre) |
| Animations | `motion` (framer-motion) |
| Graphes | Recharts |
| Carte | Leaflet + MapLibre (tuiles OpenFreeMap) |
| Tests | Vitest, Testing Library, MSW, Playwright, axe-core |

Il n'y a ni WebSocket, ni chat (retiré le 03/11/2026), ni bibliothèque d'icônes : les icônes sont des SVG en ligne.

## Appels à l'API : le navigateur ne l'appelle jamais

Pattern BFF : le JWT reste dans un cookie `HttpOnly` (`sessionized_athlete_token`), que seul le serveur Next lit.

- **Server Components** : `serverApiFetch()` / `serverApiFetchStatus()` de `lib/server-api.ts`, qui transmettent le cookie en `Authorization: Bearer`. Un 401 renvoie vers `/login?reason=expired`.
- **Composants client** : `clientFetch('/api/...')` (`lib/client-fetch.ts`) vers un Route Handler de `src/app/api/`, qui relaie vers l'API.
- **Route Handlers** : URL construite avec `backendUrl()` de `lib/env.ts`. Tout segment dynamique est validé par `isValidId()` avant d'être concaténé.
- **Messages d'erreur** : ceux de l'API sont en français et ne sont jamais affichés tels quels. Les routes `/api/auth/*` les traduisent (`lib/auth-errors.ts`).

## Sécurité

- `src/proxy.ts` : session exigée sur `/dashboard`, `/activities`, `/profile`, `/coaches` et `/athlete-data` (JWT absent ou expiré → `/login`). Une Content-Security-Policy avec nonce est posée sur toutes les pages.
- `lib/security-headers.ts` : la CSP et les en-têtes fixes (posés par `next.config.ts`). **Une nouvelle origine externe doit y être ajoutée et justifiée.**
- Le layout racine applique le nonce (en-tête `x-nonce`) à son script de thème. Tout nouveau `<script>` inline doit porter ce nonce.
- La déconnexion (`/api/auth/logout`) fait révoquer le jeton par l'API avant d'effacer le cookie.
- `lib/redirect.ts` : `safeRedirectTarget()` pour tout paramètre `?redirect=`.

## Arborescence

```
src/
├── app/
│   ├── (app)/                 pages connectées (layout : barre latérale, consentement santé, lien d'évitement)
│   │   ├── dashboard/         calendrier du mois, récapitulatif de semaine, charge d'entraînement
│   │   ├── activities/[id]/   détail d'une activité (laps, carte, zones FC, réponse aérobie)
│   │   ├── activities/upload/ import .fit / .gpx, rattachement à une séance
│   │   ├── athlete-data/      zones et données physiologiques
│   │   ├── profile/           compte, Strava, export et suppression des données
│   │   └── coaches/           coach suivi
│   ├── (auth)/login/          connexion et inscription (consentement santé)
│   ├── (legal)/               mentions légales, politique de confidentialité
│   └── api/                   Route Handlers (BFF)
├── components/                ui/, layout/, calendar/, activities/, charts/, account/, training/
├── hooks/                     useAuth, useTheme, useZoneDistribution
├── lib/                       server-api, client-fetch, env, auth-cookie, auth-errors,
│                              security-headers, jwt, redirect, calendar, types, utils…
└── proxy.ts
tests/
├── integration/               Route Handlers et proxy, backend simulé (MSW)
└── e2e/                       Playwright sur le build de production, API simulée (mock-api/)
```

## Conventions

- Composants en PascalCase, un par fichier ; hooks préfixés `use` ; pas de `any`.
- Server Components par défaut, `'use client'` seulement si une interaction l'exige.
- Commentaires en français ; noms de variables et de fonctions en anglais.
- Interface en anglais, dates formatées avec `APP_LOCALE` (`lib/utils.ts`).
- Chaque page déclare `metadata.title` (modèle `%s · Sessionized`).
- Accessibilité : texte secondaire à 60 % d'opacité au minimum (`text-text/60`), en dessous le contraste AA n'est pas atteint. Toute nouvelle page est ajoutée à l'audit axe (`tests/e2e/a11y.spec.ts`).
- Les tests portent l'identifiant du cas du plan de tests (`T01`…) dans leur nom (voir `tests/README.md`).
- Messages de commit : Conventional Commits, en français.

## Variables d'environnement

Liste commentée dans `.env.example`. Aucun secret dans le front, et rien de secret ne porte le préfixe `NEXT_PUBLIC_` (copié dans le bundle au build).

```env
API_URL=http://localhost:3001                     # serveur uniquement, lue à l'exécution
COOKIE_DOMAIN=                                    # serveur uniquement, vide recommandé
NEXT_PUBLIC_COACH_APP_URL=http://localhost:3002   # publique, figée au build
```
