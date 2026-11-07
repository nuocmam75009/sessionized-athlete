// Informations reprises par les mentions légales et la politique de
// confidentialité. Les valeurs entre crochets sont à compléter avant toute mise
// en ligne publique : la LCEN (art. 6) impose d'identifier l'éditeur, un
// contact et le directeur de la publication.
export const PUBLISHER = {
  name: '[Publisher name]',
  address: '[Postal address]',
  email: '[contact email]',
  publicationDirector: '[Publication director]',
}

// Hébergeurs et sous-traitants, d'après l'architecture déployée (CLAUDE.md) et
// la chaîne de connexion de la base (région AWS eu-west-2). Adresses à
// revérifier sur les sites des prestataires avant publication.
export const HOSTS = {
  frontend: { name: 'Vercel Inc.', address: '440 N Barranca Ave #4133, Covina, CA 91723, United States' },
  api: { name: 'Hetzner Online GmbH', address: 'Industriestr. 25, 91710 Gunzenhausen, Germany' },
  database: { name: 'Neon, Inc.', location: 'AWS London region (eu-west-2), United Kingdom' },
}

// Date affichée en tête des deux pages : à changer à chaque modification de
// leur contenu.
export const LEGAL_LAST_UPDATED = '2026-11-07'
