import Link from 'next/link'
import { HOSTS, PUBLISHER } from '@/lib/legal'

// Mentions légales, version française. Même contenu que LegalNoticeEn : une
// modification de l'une se reporte sur l'autre.
export function LegalNoticeFr({ lastUpdated }: { lastUpdated: string }) {
  return (
    <article>
      <h1>Mentions légales</h1>
      <p className="text-sm text-text/60 mt-2">{lastUpdated}</p>

      <h2 className="mt-10 mb-3">Éditeur</h2>
      <p>
        Sessionized est édité par {PUBLISHER.name}, {PUBLISHER.address}.
        <br />
        Contact&nbsp;: {PUBLISHER.email}
      </p>

      <h2 className="mt-10 mb-3">Directeur de la publication</h2>
      <p>{PUBLISHER.publicationDirector}</p>

      <h2 className="mt-10 mb-3">Hébergement</h2>
      <p>
        Site web&nbsp;: {HOSTS.frontend.name}, {HOSTS.frontend.address}.
        <br />
        Serveur applicatif&nbsp;: {HOSTS.api.name}, {HOSTS.api.address}.
      </p>

      <h2 className="mt-10 mb-3">Données personnelles</h2>
      <p>
        L’usage qui est fait de vos données, et la façon d’exercer vos droits, sont expliqués dans la{' '}
        <Link href="/privacy" className="text-accent underline hover:text-accent-700">
          politique de confidentialité
        </Link>
        .
      </p>
    </article>
  )
}
