'use client'

import { Badge } from '@/components/ui/Badge'
import { RowLink } from '@/components/ui/RowLink'
import { thClass, tdClass } from '@/components/ui/table'
import { WEEK, PAST, getTodayWorkout, tagVariant, labelFor } from '@/lib/mock-data'
import { useSessionState } from '@/lib/session-store'

export default function ActivitiesPage() {
  const session = useSessionState()
  const todayWorkout = getTodayWorkout()

  const historyFromWeek = WEEK.filter((w) => w.status === 'completed').map((w) => ({
    id: w.id,
    date: w.date,
    title: w.title,
    planned: `${w.distance} · ${w.duration}`,
    actual: `${w.actual!.distance} · ${w.actual!.duration}`,
    status: w.status,
    href: `/activities/${w.id}`,
  }))

  const historyFromPast = PAST.map((p, i) => ({
    id: `past-${i}`,
    date: p.date,
    title: p.title,
    planned: p.planned,
    actual: p.actual,
    status: p.status,
    href: undefined,
  }))

  const rows = session.uploaded && session.lastUpload
    ? [
        {
          id: 'uploaded-today',
          date: todayWorkout.date,
          title: todayWorkout.title,
          planned: `${todayWorkout.distance} · ${todayWorkout.duration}`,
          actual: `${session.lastUpload.distance} · ${session.lastUpload.duration}`,
          status: 'completed' as const,
          href: `/activities/${todayWorkout.id}`,
        },
        ...historyFromWeek,
        ...historyFromPast,
      ]
    : [...historyFromWeek, ...historyFromPast]

  return (
    <div>
      <h1>Activity log</h1>
      <p className="opacity-70 mb-5">Sessions completed against what your coach planned.</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={thClass}>Date</th>
            <th className={thClass}>Workout</th>
            <th className={thClass}>Planned</th>
            <th className={thClass}>Actual</th>
            <th className={thClass}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RowLink key={row.id} href={row.href}>
              <td className={`${tdClass} text-text/60`}>{row.date}</td>
              <td className={tdClass}>{row.title}</td>
              <td className={`${tdClass} text-text/60`}>{row.planned}</td>
              <td className={tdClass}>{row.actual}</td>
              <td className={tdClass}>
                <Badge variant={tagVariant(row.status)}>{labelFor(row.status)}</Badge>
              </td>
            </RowLink>
          ))}
        </tbody>
      </table>
    </div>
  )
}
