import { CoachCard } from '@/components/marketplace/CoachCard'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment } from '@/lib/types'

export default async function CoachesPage() {
  const { status, data } = await serverApiFetchStatus<CoachAssignment[]>('/users/coaches')
  const coaches = data ?? []

  return (
    <div>
      <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
        Marketplace
      </div>
      <h1>Find your coach</h1>
      {status !== 200 ? (
        <p className="text-red-600 mb-4">Impossible de charger les coachs.</p>
      ) : (
        <p className="opacity-70 mb-8">
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
