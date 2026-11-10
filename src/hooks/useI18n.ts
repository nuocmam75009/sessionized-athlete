'use client'

import { useContext } from 'react'
import { I18nContext } from '@/components/layout/I18nProvider'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries'

// Pendant côté client de getI18n() (lib/i18n/server.ts) : la langue de la
// page, et les textes dans cette langue.
export function useI18n(): { locale: Locale; t: Dictionary } {
  const locale = useContext(I18nContext)
  return { locale, t: getDictionary(locale) }
}
