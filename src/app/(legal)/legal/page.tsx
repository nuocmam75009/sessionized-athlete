import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { LEGAL_LAST_UPDATED } from '@/lib/legal'
import { formatLegalDate } from '@/lib/utils'
import { LegalNoticeEn } from './LegalNoticeEn'
import { LegalNoticeFr } from './LegalNoticeFr'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.legalNotice }
}

// Mentions légales exigées par l'article 6 de la LCEN : éditeur, directeur de
// la publication, hébergeur. Un texte entier par langue plutôt qu'une clé par
// phrase : c'est un texte suivi, avec son balisage, qu'on relit d'un bloc.
export default async function LegalNoticePage() {
  const { locale, t } = await getI18n()
  const lastUpdated = t.legal.lastUpdated(formatLegalDate(LEGAL_LAST_UPDATED, locale))
  return locale === 'fr' ? <LegalNoticeFr lastUpdated={lastUpdated} /> : <LegalNoticeEn lastUpdated={lastUpdated} />
}
