import Link from 'next/link'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { MonthSportBreakdown } from '@/components/calendar/MonthSportBreakdown'
import { Stat } from '@/components/ui/Stat'
import { buildMonthEntries, buildMonthSummary, formatMonthLabel, getMonthStart, toMonthParam } from '@/lib/calendar'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

const MONTH_PARAM_RE = /^\d{4}-\d{2}$/

function parseMonthParam(raw: string | undefined): Date {
  if (raw && MONTH_PARAM_RE.test(raw)) {
    const [y, m] = raw.split('-').map(Number)
    const parsed = new Date(y, m - 1, 1)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return getMonthStart(new Date())
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const monthStart = parseMonthParam(month)
  const currentMonthStart = getMonthStart(new Date())
  const isCurrentMonth = monthStart.getTime() === currentMonthStart.getTime()

  const { data: strava } = await serverApiFetchStatus<{ connected: boolean }>('/strava/status')
  if (strava?.connected) {
    // Sync avant de charger les activités pour que les runs Strava tout
    // juste apparus atterrissent sur leur case dès ce chargement — pas de
    // sélection manuelle, une activité échouée/API Strava down dégrade
    // silencieusement (serverApiFetchStatus n'throw jamais).
    await serverApiFetchStatus('/strava/sync', { method: 'POST' })
  }

  const [{ data: workouts }, { data: activities }] = await Promise.all([
    serverApiFetchStatus<Workout[]>('/workouts'),
    serverApiFetchStatus<Activity[]>('/activities'),
  ])

  const entries = buildMonthEntries(monthStart, workouts ?? [], activities ?? [])
  const summary = buildMonthSummary(entries)

  const prevMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

  return (
    // data-wide : le dashboard déborde le cadre 920px du layout pour loger le
    // récapitulatif de semaine à côté du calendrier (voir (app)/layout.tsx).
    <div data-wide>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="mb-0">{formatMonthLabel(monthStart)}</h1>
        <div className="flex gap-3 items-center text-sm">
          <Link href={`/dashboard?month=${toMonthParam(prevMonth)}`} className="text-accent hover:text-accent-700">
            ‹ Previous
          </Link>
          {!isCurrentMonth && (
            <Link href="/dashboard" className="text-accent hover:text-accent-700">
              This month
            </Link>
          )}
          <Link href={`/dashboard?month=${toMonthParam(nextMonth)}`} className="text-accent hover:text-accent-700">
            Next ›
          </Link>
        </div>
      </div>
      <MonthCalendar entries={entries} />
      <div className="flex gap-8 flex-wrap mt-6 pt-6 border-t border-divider">
        <Stat label="Distance" value={formatDistance(summary.distanceM)} />
        <Stat label="Time" value={formatDuration(summary.durationSec)} />
        <Stat label="Activities" value={String(summary.activityCount)} />
      </div>
      <MonthSportBreakdown bySport={summary.bySport} />
    </div>
  )
}
