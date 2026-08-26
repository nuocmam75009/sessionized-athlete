import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'
import { findLinkedActivityId, summarizeWorkoutLaps } from '@/lib/plan-format'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDateLabel, isSameCalendarDay } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

export default async function DashboardPage() {
  const [{ data: workouts }, { data: activities }] = await Promise.all([
    serverApiFetchStatus<Workout[]>('/workouts'),
    serverApiFetchStatus<Activity[]>('/activities'),
  ])

  const now = new Date()
  const today = (workouts ?? []).find((w) => isSameCalendarDay(new Date(w.scheduledDate), now))
  const activityId = today ? findLinkedActivityId(today.id, activities ?? []) : undefined

  if (!today) {
    return (
      <div>
        <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
          {formatDateLabel(now.toISOString())} · Today
        </div>
        <h1>No session scheduled today</h1>
        <p className="opacity-70 mb-6">Nothing planned for today — log a run anyway if you went out.</p>
        <Link href="/activities/upload" className={buttonClassName('primary')}>
          Upload activity
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent mb-2">
        {formatDateLabel(today.scheduledDate)} · Today
      </div>
      <h1>{today.title}</h1>
      <div className="flex gap-8 my-6">
        <Stat label="Target" value={summarizeWorkoutLaps(today.laps)} />
      </div>
      {today.coachNote && (
        <blockquote className="mb-6 pl-4 border-l-2 border-accent-200 italic text-[17px] max-w-[56ch]">
          “{today.coachNote}”
        </blockquote>
      )}
      <div className="flex gap-3">
        {activityId && (
          <Link href={`/activities/${activityId}`} className={buttonClassName('primary')}>
            View full breakdown
          </Link>
        )}
        <Link href="/activities/upload" className={buttonClassName(activityId ? 'secondary' : 'primary')}>
          Upload activity
        </Link>
      </div>
    </div>
  )
}
