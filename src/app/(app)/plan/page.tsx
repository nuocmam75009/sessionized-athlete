import { Badge } from '@/components/ui/Badge'
import { RowLink } from '@/components/ui/RowLink'
import { thClass, tdClass } from '@/components/ui/table'
import { findLinkedActivityId, summarizeWorkoutLaps } from '@/lib/plan-format'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDateLabel } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

export default async function PlanPage() {
  const [{ data: workouts }, { data: activities }] = await Promise.all([
    serverApiFetchStatus<Workout[]>('/workouts'),
    serverApiFetchStatus<Activity[]>('/activities'),
  ])

  const rows = workouts ?? []
  const now = new Date()

  return (
    <div>
      <h1>Planned sessions</h1>
      <p className="opacity-70 mb-5">Everything your coach has scheduled, in order.</p>
      {rows.length === 0 ? (
        <p className="text-text/60">No planned sessions yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Session</th>
              <th className={thClass}>Target</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((workout) => {
              const activityId = findLinkedActivityId(workout.id, activities ?? [])
              const isPast = new Date(workout.scheduledDate) < now
              return (
                <RowLink key={workout.id} href={activityId ? `/activities/${activityId}` : undefined}>
                  <td className={tdClass}>{formatDateLabel(workout.scheduledDate)}</td>
                  <td className={tdClass}>{workout.title}</td>
                  <td className={`${tdClass} text-text/60`}>{summarizeWorkoutLaps(workout.laps)}</td>
                  <td className={tdClass}>
                    <Badge variant={isPast ? 'neutral' : 'accent'}>{isPast ? 'Past' : 'Upcoming'}</Badge>
                  </td>
                </RowLink>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
