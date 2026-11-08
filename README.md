# Sessionized — front athlète

Application Next.js de l'athlète : calendrier des séances prescrites par le coach, import des fichiers `.fit` et `.gpx`, analyse des activités (zones de fréquence cardiaque, réponse aérobie, charge d'entraînement), synchronisation Strava, droits sur ses données personnelles (export, suppression du compte). Elle s'appuie sur l'API NestJS (`sessionized-api`) et ne l'appelle jamais depuis le navigateur : tout passe par les Route Handlers de `src/app/api/`, qui relaient le jeton stocké en cookie `HttpOnly`.

## Prérequis

- Node.js 22 et npm
- L'API `sessionized-api` démarrée en local (port 3001), ou Docker pour lancer toute la pile

## Démarrer en local

```bash
npm install
cp .env.example .env    # puis adapter si besoin
npm run dev             # http://localhost:3000
```

## Variables d'environnement

Elles sont décrites dans [`.env.example`](.env.example). Le front n'a besoin d'**aucun secret** : ceux de Strava, du JWT et de la base appartiennent à l'API.

| Variable | Lue par | Moment | Rôle |
|---|---|---|---|
| `API_URL` | Serveur Next.js | Exécution | URL de l'API NestJS |
| `COOKIE_DOMAIN` | Serveur Next.js | Exécution | Domaine du cookie de session (vide recommandé) |
| `NEXT_PUBLIC_COACH_APP_URL` | Navigateur | Build | App coach, vers laquelle un compte coach est redirigé |

Une variable préfixée `NEXT_PUBLIC_` est copiée dans le JavaScript envoyé au navigateur au moment de `next build` : elle est publique, et la changer impose de reconstruire. Les autres restent sur le serveur et se lisent au démarrage.

## Pile complète avec Docker

[`docker-compose.yml`](docker-compose.yml) lance le front, l'API, PostgreSQL et Redis. Le dépôt de l'API doit être cloné à côté de celui-ci (`../sessionized-api`).

```bash
docker compose up --build                  # front sur http://localhost:3000, API sur :3001, base sur :5434
docker compose --profile demo up --build   # idem, avec le jeu de données de démonstration
docker compose down -v                     # arrête la pile et supprime la base
```

Même enchaînement qu'en production : le service `migrate` applique les migrations avec le rôle propriétaire de la base et crée le rôle applicatif `sessionized_app`, puis l'API démarre avec ce rôle, sans droit sur le schéma. Avec `--profile demo`, le service `seed` crée un coach et deux athlètes : `camille.durand@demo.test` a un plan de dix semaines et six semaines de séances (mot de passe `Tempo-Fartlek-2026`). Sans ce profil, la base démarre vide : créer un compte depuis l'écran d'inscription. Strava n'est pas configuré dans cette pile.

L'image du front ([`Dockerfile`](Dockerfile)) est construite en mode `output: 'standalone'`. Elle s'exécute avec un utilisateur non privilégié, et la même image sert tous les environnements : seule `NEXT_PUBLIC_COACH_APP_URL` est figée au build (argument `NEXT_PUBLIC_COACH_APP_URL`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires et d'intégration (Vitest) |
| `npm run test:e2e` | Tests système, sécurité et accessibilité (Playwright) |
| `npm run test:coverage` | Couverture de code |

Le détail des tests, de leur environnement et de la traçabilité avec le plan de tests est dans [`tests/README.md`](tests/README.md).

## Sécurité

- **Session** : jeton JWT dans un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, qui expire avec le jeton. La déconnexion fait révoquer le jeton par l'API.
- **En-têtes** : Content-Security-Policy stricte avec un nonce par requête, posée par [`src/proxy.ts`](src/proxy.ts) ; HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` et `Permissions-Policy` posés par [`next.config.ts`](next.config.ts). Détail dans [`src/lib/security-headers.ts`](src/lib/security-headers.ts).
- **Intégration continue** : [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint, types, tests Vitest et Playwright, audit des dépendances de production, image Docker) ; Dependabot chaque semaine.
