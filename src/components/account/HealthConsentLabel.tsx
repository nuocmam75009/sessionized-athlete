'use client'

import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'

// Texte du consentement aux données de santé (art. 9 du RGPD), partagé par
// l'inscription et par l'écran qui le demande aux comptes plus anciens : un
// même accord, daté par l'API, ne doit pas porter sur deux libellés différents.
// Ses deux versions (anglaise et française) disent la même chose : l'athlète
// consent dans la langue qu'il lit.
export function HealthConsentLabel() {
  const { t } = useI18n()
  return (
    <>
      {t.consent.labelBefore}{' '}
      {/* Nouvel onglet : suivre le lien ici ferait perdre la saisie en cours. */}
      <Link
        href="/privacy"
        target="_blank"
        aria-label={t.consent.labelLinkNewTab}
        className="text-accent underline hover:text-accent-700"
      >
        {t.consent.labelLink}
      </Link>
      {t.consent.labelAfter}
    </>
  )
}
