import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { LEGAL_LAST_UPDATED } from '@/lib/legal'
import { formatLegalDate } from '@/lib/utils'
import { PrivacyPolicyEn } from './PrivacyPolicyEn'
import { PrivacyPolicyFr } from './PrivacyPolicyFr'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.privacy }
}

// Information des personnes (art. 13 du RGPD). Un texte entier par langue
// plutôt qu'une clé par phrase : c'est un texte suivi, avec son balisage, qu'on
// relit d'un bloc. Les deux versions doivent dire la même chose.
export default async function PrivacyPolicyPage() {
  const { locale, t } = await getI18n()
  const lastUpdated = t.legal.lastUpdated(formatLegalDate(LEGAL_LAST_UPDATED, locale))
  return locale === 'fr' ? <PrivacyPolicyFr lastUpdated={lastUpdated} /> : <PrivacyPolicyEn lastUpdated={lastUpdated} />
}
