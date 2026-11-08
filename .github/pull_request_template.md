## Objet

<!-- Ce que change la PR, et pourquoi. Lien vers l'issue : Closes #… -->

## Type

- [ ] Fonctionnalité (`feat`)
- [ ] Correction (`fix`)
- [ ] Sécurité ou accessibilité
- [ ] Refactorisation, documentation, outillage (`refactor`, `docs`, `chore`, `ci`)

## Vérifications

- [ ] `npm run lint`, `npx tsc --noEmit` et `npm test` passent en local
- [ ] Tests ajoutés ou mis à jour, avec l'identifiant du cas du plan de tests (Txx) dans leur nom
- [ ] Nouvelle page : titre (`metadata.title`) et audit axe (ajout à `tests/e2e/a11y.spec.ts`)
- [ ] Nouvelle origine externe : ajoutée à la CSP (`src/lib/security-headers.ts`), et justifiée
- [ ] Aucun secret ni jeton exposé au JavaScript du navigateur
- [ ] Captures d'écran en thème clair et sombre si l'interface change

## Comment tester

<!-- Étapes de recette, avec l'API simulée (npm run mock-api) ou le seed de l'API. -->
