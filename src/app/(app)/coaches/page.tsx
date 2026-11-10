import type { Metadata } from 'next'
import { CoachCard } from '@/components/marketplace/CoachCard'
import { getI18n } from '@/lib/i18n/server'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.coaches }
}

export default async function CoachesPage() {
  const [{ status, data }, { t }] = await Promise.all([
    serverApiFetchStatus<CoachAssignment[]>('/users/coaches'),
    getI18n(),
  ])
  const coaches = data ?? []

  return (
    <div>
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        {t.coaches.eyebrow}
      </div>
      <h1>{t.coaches.title}</h1>
      {status !== 200 ? (
        <p role="alert" className="text-danger mb-4">
          {t.coaches.loadFailed}
        </p>
      ) : (
        <p className="text-text/60 mt-2 mb-8 max-w-[52ch]">{t.coaches.available(coaches.length)}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </div>
  )
}
