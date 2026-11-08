# Analyse d'impact relative à la protection des données (AIPD) — version simplifiée

Démarche de la CNIL (méthode PIA) appliquée au traitement « suivi et analyse de l'entraînement » de Sessionized, au **08/11/2026**. Elle complète le [registre des traitements](registre-des-traitements.md).

## Pourquoi une AIPD

L'article 35 du RGPD impose une AIPD pour un traitement « susceptible d'engendrer un risque élevé ». Les lignes directrices européennes la considèrent nécessaire dès que deux critères sur neuf sont réunis. Sessionized en réunit au moins deux :

- **données sensibles ou à caractère hautement personnel** : fréquence cardiaque, poids, traces GPS qui révèlent le domicile et les habitudes ;
- **évaluation de la personne** : la charge d'entraînement (CTL, ATL, TSB) estime la forme et la fatigue de l'athlète ;
- **croisement de jeux de données**, dans une moindre mesure : activités importées de Strava et fichiers `.fit` de la montre.

Le volume (projet de formation, quelques comptes) n'est pas une « grande échelle ». L'AIPD est donc menée sous forme simplifiée, comme démarche.

## 1. Description du traitement

| Élément | Contenu |
|---|---|
| Finalité | Planifier les séances de l'athlète et les comparer à ce qu'il a réellement couru |
| Données | Voir le traitement 2 du registre |
| Flux | Montre → fichier `.fit` → front athlète → API → PostgreSQL ; Strava → API → PostgreSQL ; PostgreSQL → API → fronts athlète et coach |
| Supports | Navigateur ; fronts sur Vercel ; API sur Hetzner ; base Neon (Londres) |
| Accès | L'athlète, son coach ; l'équipe technique en exploitation |

## 2. Nécessité et proportionnalité

| Principe | Mesure en place |
|---|---|
| Base légale | Consentement explicite daté (`healthDataConsentAt`), recueilli à l'inscription et demandé aux comptes créés avant |
| Minimisation | Âge, poids, taille et métabolisme facultatifs ; aucun traceur ni outil de mesure d'audience. **Écart** : points GPS conservés au mètre près, départ et arrivée compris |
| Conservation | Tant que le compte existe, effacement immédiat à la suppression. **Écart** : durée des journaux non fixée |
| Information | Politique de confidentialité et mentions légales lisibles sans compte, liées depuis chaque écran (T23) |
| Accès et portabilité | Export JSON complet, fichiers d'origine compris, en un clic (T25) |
| Effacement | Suppression du compte en un clic, mot de passe redemandé (T25) |
| Rectification | Profil modifiable dans l'app |
| Sous-traitants | Identifiés dans la politique ; contrats à vérifier |

## 3. Risques

Échelle de la CNIL : 1 négligeable, 2 limitée, 3 importante, 4 maximale.

| Risque | Principales sources | Impacts pour l'athlète | Gravité | Vraisemblance | Mesures existantes |
|---|---|---|---|---|---|
| **Accès illégitime** | Autre utilisateur (IDOR), vol de session, injection, fuite d'une sauvegarde | Divulgation de son état de santé ; localisation de son domicile et de ses horaires de sortie | 3 | 2 | Contrôle d'accès par propriété, testé (T14, `security.e2e-spec.ts`) ; cookie `HttpOnly` ; requêtes paramétrées (Prisma) ; jetons Strava chiffrés ; mots de passe hachés, politique CNIL, limitation des tentatives |
| **Modification non désirée** | Session détournée, erreur d'import | Analyse et charge d'entraînement faussées, séances mal adaptées | 2 | 1 | Contrôle d'accès en écriture ; déduplication des imports (empreinte du fichier) |
| **Disparition** | Panne, suppression par erreur, compte supprimé par un tiers | Perte de l'historique d'entraînement | 2 | 2 | Historique de restauration de l'hébergeur de base ; mot de passe redemandé avant suppression ; export à disposition de l'athlète |

## 4. Plan d'action

| Mesure | Risque traité | Priorité |
|---|---|---|
| Zone de confidentialité autour du départ et de l'arrivée des traces GPS | Accès illégitime (localisation du domicile) | Haute |
| Durée de conservation des journaux, rotation, e-mails remplacés par les identifiants | Accès illégitime, minimisation | Moyenne |
| Sauvegarde et restauration testées | Disparition | Moyenne |
| En-têtes de sécurité dans les fronts (CSP, HSTS) | Accès illégitime (XSS) | Moyenne |
| Révocation des JWT côté API (un jeton reste valable 7 jours, même après suppression du compte, sans plus donner accès à aucune donnée) | Accès illégitime | Basse |
| Consentement vérifié par l'API sur les routes d'import, en plus de l'écran du front | Licéité | Basse |
| Révocation de l'autorisation Strava à la suppression du compte | Minimisation | Basse |

## Conclusion

Avec les mesures existantes, le risque résiduel est jugé **acceptable** pour le périmètre actuel. La zone de confidentialité GPS est la mesure à mettre en place avant toute ouverture à un public plus large.
