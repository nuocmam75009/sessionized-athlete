# Sessionized — front athlète

Application Next.js de l'athlète : calendrier des séances prescrites par le coach, import des fichiers `.fit` et `.gpx`, analyse des activités, synchronisation Strava. Elle s'appuie sur l'API NestJS (`sessionized-api`) et ne l'appelle jamais depuis le navigateur : tout passe par les Route Handlers de `src/app/api/`, qui relaient le jeton stocké en cookie `HttpOnly`.

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

[`docker-compose.yml`](docker-compose.yml) lance le front, l'API et une base PostgreSQL locale. Le dépôt de l'API doit être cloné à côté de celui-ci (`../sessionized-api`).

```bash
docker compose up --build    # front sur http://localhost:3000, API sur :3001, base sur :5433
docker compose down          # arrête la pile (ajouter -v pour supprimer la base)
```

La base démarre vide (migrations appliquées au lancement de l'API) : créer un compte depuis l'écran d'inscription. Strava n'est pas configuré dans cette pile.

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
