# Registre des traitements — Sessionized

Registre tenu au titre de l'article 30 du RGPD, sur le modèle de la CNIL. Il décrit les traitements tels que le code les met en œuvre au **08/11/2026** (`sessionized-api`, `sessionized-athlete`, `sessionized-coach`). Il est à mettre à jour à chaque nouvelle donnée collectée, en même temps que la politique de confidentialité ([privacy/page.tsx](../../src/app/(legal)/privacy/page.tsx)).

**Responsable du traitement** : à renseigner (identité, adresse, contact), comme dans [legal.ts](../../src/lib/legal.ts). Pas de délégué à la protection des données désigné : il n'est pas obligatoire pour cette taille de service, mais un traitement de données de santé à grande échelle le rendrait obligatoire (art. 37).

**Sous-traitants communs à tous les traitements** :

| Sous-traitant | Rôle | Localisation | Encadrement du transfert |
|---|---|---|---|
| Vercel Inc. | Hébergement des deux frontends | États-Unis | Clauses contractuelles types (à vérifier dans le DPA du compte) |
| Hetzner Online GmbH | Hébergement de l'API | Allemagne (UE) | Aucun transfert |
| Neon, Inc. | Base PostgreSQL | AWS Londres (eu-west-2), Royaume-Uni | Décision d'adéquation de la Commission (à vérifier dans le DPA) |

---

## 1. Gestion des comptes et de la relation de coaching

| Rubrique | Contenu |
|---|---|
| Finalité | Créer et sécuriser les comptes, relier un athlète à son coach, permettre au coach de prescrire des séances |
| Base légale | Exécution du contrat (art. 6.1.b) |
| Personnes concernées | Athlètes, coachs |
| Données | E-mail, prénom, nom, mot de passe haché (bcrypt), rôle, notes des coachs par les athlètes, plans et séances prescrites |
| Destinataires | L'athlète ; son coach pour les données de coaching ; aucun autre utilisateur (contrôle d'accès testé, T14 et `security.e2e-spec.ts`) |
| Durée de conservation | Tant que le compte existe ; effacement immédiat à la suppression du compte (`DELETE /users/me`, cascade en base) |
| Mesures de sécurité | HTTPS ; mot de passe conforme à la recommandation CNIL n° 2022-100 ; 5 tentatives de connexion par compte et par 15 min ; session dans un cookie `HttpOnly`, `SameSite=Lax` ; mot de passe redemandé pour supprimer le compte |

## 2. Suivi et analyse de l'entraînement

| Rubrique | Contenu |
|---|---|
| Finalité | Afficher le calendrier, analyser les séances (laps, zones cardiaques, charge d'entraînement) |
| Base légale | **Consentement explicite** (art. 9.2.a) pour les données de santé, daté en base (`User.healthDataConsentAt`) ; demandé à l'inscription, et avant tout affichage aux comptes créés plus tôt |
| Personnes concernées | Athlètes |
| Données | **Santé** : fréquence cardiaque, zones, poids, taille, âge, métabolisme de base, calories, ressentis. **Localisation** : traces GPS (`TrackPoint`, `RoutePoint`), fichiers `.fit` et `.gpx` d'origine |
| Destinataires | L'athlète et son coach |
| Durée de conservation | Tant que le compte existe ; effacement immédiat à la suppression du compte. Retrait du consentement = suppression du compte (le service ne fonctionne pas sans ces données) |
| Mesures de sécurité | Celles du traitement 1 ; export de toutes les données en JSON (`GET /users/me/export`) ; aucun traceur ni outil de mesure d'audience |

## 3. Import des activités Strava

| Rubrique | Contenu |
|---|---|
| Finalité | Importer les activités de l'athlète depuis Strava, à sa demande |
| Base légale | Consentement (connexion OAuth à l'initiative de l'athlète, révocable depuis le profil) ; consentement explicite du traitement 2 pour les données de santé importées |
| Personnes concernées | Athlètes ayant connecté Strava |
| Données | Jetons OAuth Strava (chiffrés en AES-256-GCM), activités et zones importées |
| Destinataires | Strava (source des données, responsable de traitement distinct) |
| Durée de conservation | Jetons : jusqu'à la déconnexion ou la suppression du compte. Activités : comme le traitement 2 |
| Mesures de sécurité | Jetons chiffrés en base, clé dans la configuration du serveur ; synchronisation seulement à la demande |

## 4. Sécurité du service

| Rubrique | Contenu |
|---|---|
| Finalité | Détecter les abus et diagnostiquer les erreurs |
| Base légale | Intérêt légitime (art. 6.1.f) |
| Personnes concernées | Tous les utilisateurs |
| Données | Journaux de l'API : méthode, URL, statut, durée, e-mail et rôle de l'utilisateur. Redis : empreinte SHA-256 de l'e-mail et compteur de tentatives de connexion |
| Destinataires | L'équipe technique |
| Durée de conservation | Redis : 15 minutes (expiration automatique). **Journaux : à définir** (la CNIL recommande de 6 mois à 1 an) et à appliquer par la rotation des journaux du conteneur |
| Mesures de sécurité | Aucun corps de requête journalisé (ni mot de passe, ni donnée de santé) |

---

## Points ouverts

- Identité du responsable de traitement et contact, à renseigner.
- Durée de conservation des journaux de l'API, à fixer et à appliquer ; remplacer l'e-mail par l'identifiant dans les journaux (minimisation).
- Garanties de transfert (Vercel, Neon) à vérifier dans les contrats signés avec chaque prestataire.
- Comptes coach : ni export ni suppression en libre-service à ce jour (la suppression d'un coach emporterait les plans de ses athlètes, en cascade).

Voir aussi l'[analyse d'impact (AIPD)](aipd.md).
