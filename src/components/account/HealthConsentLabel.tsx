import Link from 'next/link'

// Texte du consentement aux données de santé (art. 9 du RGPD), partagé par
// l'inscription et par l'écran qui le demande aux comptes plus anciens : un
// même accord, daté par l'API, ne doit pas porter sur deux libellés différents.
export function HealthConsentLabel() {
  return (
    <>
      I agree that Sessionized processes my health data (heart rate, weight, training activities) to run the
      service, as described in the{' '}
      {/* Nouvel onglet : suivre le lien ici ferait perdre la saisie en cours. */}
      <Link
        href="/privacy"
        target="_blank"
        aria-label="privacy policy (opens in a new tab)"
        className="text-accent underline hover:text-accent-700"
      >
        privacy policy
      </Link>
      .
    </>
  )
}
