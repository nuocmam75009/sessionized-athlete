'use client'

import { createContext, type ReactNode } from 'react'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

// Seule la langue circule dans le contexte, pas le dictionnaire : les
// dictionnaires contiennent des fonctions, que le layout (Server Component) ne
// peut pas sérialiser vers le client. useI18n() le retrouve à partir de la
// langue.
//
// Valeur par défaut : la langue par défaut. Un composant rendu hors du
// provider (test unitaire) s'affiche donc en anglais, comme avant l'i18n.
export const I18nContext = createContext<Locale>(DEFAULT_LOCALE)

// Posé par le layout racine avec la langue résolue côté serveur (cookie, puis
// Accept-Language). Au changement de langue, la Server Function re-rend le
// layout : le provider reçoit la nouvelle langue, et tout l'arbre client suit.
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={locale}>{children}</I18nContext>
}
