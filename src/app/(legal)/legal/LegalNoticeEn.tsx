import Link from 'next/link'
import { HOSTS, PUBLISHER } from '@/lib/legal'

// Mentions légales, version anglaise. Même contenu que LegalNoticeFr : une
// modification de l'une se reporte sur l'autre.
export function LegalNoticeEn({ lastUpdated }: { lastUpdated: string }) {
  return (
    <article>
      <h1>Legal notice</h1>
      <p className="text-sm text-text/60 mt-2">{lastUpdated}</p>

      <h2 className="mt-10 mb-3">Publisher</h2>
      <p>
        Sessionized is published by {PUBLISHER.name}, {PUBLISHER.address}.
        <br />
        Contact: {PUBLISHER.email}
      </p>

      <h2 className="mt-10 mb-3">Publication director</h2>
      <p>{PUBLISHER.publicationDirector}</p>

      <h2 className="mt-10 mb-3">Hosting</h2>
      <p>
        Website: {HOSTS.frontend.name}, {HOSTS.frontend.address}.
        <br />
        Application server: {HOSTS.api.name}, {HOSTS.api.address}.
      </p>

      <h2 className="mt-10 mb-3">Personal data</h2>
      <p>
        How your data is used, and how to exercise your rights, is explained in the{' '}
        <Link href="/privacy" className="text-accent underline hover:text-accent-700">
          privacy policy
        </Link>
        .
      </p>
    </article>
  )
}
