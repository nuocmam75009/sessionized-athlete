import { CoachCard } from '@/components/marketplace/CoachCard'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment } from '@/lib/types'

export default async function CoachesPage() {
  const { status, data } = await serverApiFetchStatus<CoachAssignment[]>('/users/coaches')
  const coaches = data ?? []

  return (
    <div>
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        Marketplace
      </div>
      <h1>Find your coach</h1>
      {status !== 200 ? (
        <p className="text-danger mb-4">Impossible de charger les coachs.</p>
      ) : (
        <p className="text-text/50 mt-2 mb-8 max-w-[52ch]">
          {coaches.length} coachs disponibles — parcours et choisis celui qui correspond à ton objectif.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </div>
  )
}
