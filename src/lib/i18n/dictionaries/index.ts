import type { Locale } from '../config'
import en, { type Dictionary } from './en'
import fr from './fr'

export type { Dictionary }

// Les deux dictionnaires sont importés statiquement, côté serveur comme côté
// client : quelques kilo-octets de texte, contre un aller-retour réseau à
// chaque changement de langue s'ils étaient chargés à la demande. Ils
// contiennent des fonctions (pluriels), qu'un Server Component ne pourrait de
// toute façon pas transmettre en props à un composant client.
const DICTIONARIES: Record<Locale, Dictionary> = { en, fr }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}
