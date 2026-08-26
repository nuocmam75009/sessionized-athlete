import { Badge } from '@/components/ui/Badge'
import { RowLink } from '@/components/ui/RowLink'
import { thClass, tdClass } from '@/components/ui/table'
import { formatActivity } from '@/lib/activity-format'
import { findLinkedWorkout, summarizeWorkoutLaps } from '@/lib/plan-format'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDateLabel } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

export default async function ActivitiesPage() {
  const [{ data: activities }, { data: workouts }] = await Promise.all([
    serverApiFetchStatus<Activity[]>('/activities'),
    serverApiFetchStatus<Workout[]>('/workouts'),
  ])

  const rows = activities ?? []
  const plannedWorkouts = workouts ?? []

  return (
    <div>
      <h1>Activity log</h1>
      <p className="opacity-70 mb-5">Sessions completed against what your coach planned.</p>
      {rows.length === 0 ? (
        <p className="text-text/60">No activities logged yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Workout</th>
              <th className={thClass}>Planned</th>
              <th className={thClass}>Actual</th>
              <th className={thClass}>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((activity) => {
              const workout = findLinkedWorkout(activity, plannedWorkouts)
              const actual = formatActivity(activity)
              return (
                <RowLink key={activity.id} href={`/activities/${activity.id}`}>
                  <td className={`${tdClass} text-text/60`}>{formatDateLabel(activity.startedAt)}</td>
                  <td className={tdClass}>{workout?.title ?? 'Unplanned'}</td>
                  <td className={`${tdClass} text-text/60`}>
                    {workout ? summarizeWorkoutLaps(workout.laps) : '—'}
                  </td>
                  <td className={tdClass}>
                    {actual.distance} · {actual.duration}
                  </td>
                  <td className={tdClass}>
                    <Badge variant="outline">{activity.source}</Badge>
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
