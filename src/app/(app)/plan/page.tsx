import { Badge } from '@/components/ui/Badge'
import { RowLink } from '@/components/ui/RowLink'
import { thClass, tdClass } from '@/components/ui/table'
import { findLinkedActivityId, summarizePlannedLaps } from '@/lib/plan-format'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDateLabel } from '@/lib/utils'
import type { Activity, PlannedSession } from '@/lib/types'

export default async function PlanPage() {
  const [{ data: plans }, { data: activities }] = await Promise.all([
    serverApiFetchStatus<PlannedSession[]>('/plans'),
    serverApiFetchStatus<Activity[]>('/activities'),
  ])

  const sessions = plans ?? []
  const now = new Date()

  return (
    <div>
      <h1>Planned sessions</h1>
      <p className="opacity-70 mb-5">Everything your coach has scheduled, in order.</p>
      {sessions.length === 0 ? (
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
            {sessions.map((session) => {
              const activityId = findLinkedActivityId(session.id, activities ?? [])
              const isPast = new Date(session.scheduledDate) < now
              return (
                <RowLink key={session.id} href={activityId ? `/activities/${activityId}` : undefined}>
                  <td className={tdClass}>{formatDateLabel(session.scheduledDate)}</td>
                  <td className={tdClass}>{session.title}</td>
                  <td className={`${tdClass} text-text/60`}>{summarizePlannedLaps(session.plannedLaps)}</td>
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
