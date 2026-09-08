import Link from 'next/link'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { MonthSportBreakdown } from '@/components/calendar/MonthSportBreakdown'
import { Reveal } from '@/components/ui/Reveal'
import { Stat } from '@/components/ui/Stat'
import { buildMonthEntries, buildMonthSummary, formatMonthLabel, getMonthStart, toMonthParam } from '@/lib/calendar'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

const MONTH_PARAM_RE = /^\d{4}-\d{2}$/

const MONTH_NAV_LINK =
  'rounded-sm px-3 py-1.5 text-text/60 transition-colors hover:bg-text/[0.06] hover:text-text'

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
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
            Calendar
          </div>
          <h1 className="mb-0">{formatMonthLabel(monthStart)}</h1>
        </div>
        {/* Navigation de mois groupée dans un même boîtier : trois liens nus
            côte à côte se lisaient comme du texte, pas comme un contrôle. */}
        <nav className="flex items-center gap-1 rounded-md border border-divider bg-surface/50 p-1 text-[13px]">
          <Link href={`/dashboard?month=${toMonthParam(prevMonth)}`} className={MONTH_NAV_LINK}>
            ‹ Previous
          </Link>
          {!isCurrentMonth && (
            <Link href="/dashboard" className={`${MONTH_NAV_LINK} text-accent hover:text-accent-700`}>
              This month
            </Link>
          )}
          <Link href={`/dashboard?month=${toMonthParam(nextMonth)}`} className={MONTH_NAV_LINK}>
            Next ›
          </Link>
        </nav>
      </div>

      {/* Ni le calendrier ni les totaux ne passent par Reveal : ils sont au-
          dessus de la ligne de flottaison, et une animation d'entrée les
          démarrerait à opacity 0 jusqu'à l'hydratation. Le calendrier étant le
          plus grand élément de la page, c'est lui que le navigateur mesure pour
          le LCP — le décaler d'une hydratation plus une demi-seconde d'animation
          se payait directement sur la métrique. */}
      <MonthCalendar entries={entries} />

      <div className="panel rounded-lg mt-6 px-6 py-5 flex gap-10 flex-wrap">
        <Stat label="Distance" value={formatDistance(summary.distanceM)} />
        <Stat label="Time" value={formatDuration(summary.durationSec)} />
        <Stat label="Activities" value={String(summary.activityCount)} />
      </div>

      {/* La répartition par sport, elle, est bien en dessous : son entrée
          animée ne coûte rien à la première peinture. */}
      <Reveal>
        <MonthSportBreakdown bySport={summary.bySport} />
      </Reveal>
    </div>
  )
}
