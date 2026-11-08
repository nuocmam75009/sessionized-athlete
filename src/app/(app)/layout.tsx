import { HealthConsentGate } from '@/components/account/HealthConsentGate'
import { AthleteSidebar } from '@/components/layout/AthleteSidebar'
import { LegalLinks } from '@/components/layout/LegalLinks'
import { serverApiFetch } from '@/lib/server-api'
import type { UserProfile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Athlète inscrit avant la case de consentement : ses données de santé sont
  // en base sans accord daté. Aucune page ne s'affiche avant sa réponse.
  // null strict : une API qui ne renvoie pas encore le champ (undefined), ou
  // injoignable, ne bloque personne.
  const user = await serverApiFetch<UserProfile>('/users/me')
  const needsHealthConsent = user?.role === 'ATHLETE' && user.healthDataConsentAt === null

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Lien d'évitement (RGAA 12.7) : premier élément atteint au clavier,
          il saute la navigation. Invisible tant qu'il n'a pas le focus. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text focus:ring-2 focus:ring-accent"
      >
        Skip to content
      </a>
      <AthleteSidebar />
      {/* Les pages sont cadrées à 920px par défaut (confort de lecture d'une
          colonne). Une page qui a besoin de plus — le dashboard et ses deux
          colonnes calendrier + récapitulatif — pose data-wide sur sa racine. */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none px-6 md:px-10 py-10 w-full max-w-[920px] has-data-wide:max-w-none">
        {needsHealthConsent ? <HealthConsentGate /> : children}
        <footer className="mt-16 border-t border-divider pt-4">
          <LegalLinks />
        </footer>
      </main>
    </div>
  )
}
