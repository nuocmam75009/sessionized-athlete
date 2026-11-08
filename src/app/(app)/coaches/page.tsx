import type { Metadata } from 'next'
import { CoachCard } from '@/components/marketplace/CoachCard'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment } from '@/lib/types'

export const metadata: Metadata = { title: 'Coaches' }

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
        <p role="alert" className="text-danger mb-4">
          Couldn&apos;t load coaches. Refresh the page to try again.
        </p>
      ) : (
        <p className="text-text/60 mt-2 mb-8 max-w-[52ch]">
          {coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'} available — browse and pick the one that fits
          your goal.
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
