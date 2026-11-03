import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { MonthSportBreakdown } from '@/components/calendar/MonthSportBreakdown'
import { TrainingLoadPanel } from '@/components/training/TrainingLoadPanel'
import { Reveal } from '@/components/ui/Reveal'
import { Stat } from '@/components/ui/Stat'
import {
  buildMonthEntries,
  buildMonthSummary,
  formatMonthLabel,
  getMonthStart,
  parseMonthParam,
  toMonthParam,
} from '@/lib/calendar'
import { serverApiFetchStatus } from '@/lib/server-api'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { Activity, TrainingLoadSeries, Workout } from '@/lib/types'

// Fenêtre affichée par le graphe de charge. Assez longue pour qu'une reprise
// ou une coupure se voient, assez courte pour que la courbe garde du relief.
const LOAD_WINDOW_DAYS = 90

const MONTH_NAV_LINK =
  'rounded-sm px-3 py-1.5 text-text/60 transition-colors hover:bg-text/[0.06] hover:text-text'

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
  let stravaSyncFailed = false
  if (strava?.connected) {
    // Sync avant de charger les activités pour que les runs Strava tout
    // juste apparus atterrissent sur leur case dès ce chargement — pas de
    // sélection manuelle.
    const { status } = await serverApiFetchStatus('/strava/sync', { method: 'POST' })
    // 409 : connexion inutilisable (token illisible, accès retiré depuis
    // Strava). Seul l'athlète peut la réparer : il est envoyé sur le bouton de
    // reconnexion du profil, qui propose aussi de déconnecter Strava — sans
    // cette issue, chaque visite du tableau de bord le renverrait là.
    if (status === 409) redirect('/profile?strava=reconnect')
    // Toute autre erreur est une panne passagère : signalée, sans bloquer.
    stravaSyncFailed = status < 200 || status >= 300
  }

  // La charge suit la navigation du calendrier : sur le mois courant elle va
  // jusqu'à maintenant, sur un mois passé elle s'arrête à sa dernière heure.
  const loadTo = isCurrentMonth
    ? new Date()
    : new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
  const loadFrom = new Date(loadTo.getTime() - LOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const loadQuery = new URLSearchParams({
    from: loadFrom.toISOString(),
    to: loadTo.toISOString(),
  })

  const [workoutsRes, activitiesRes, { data: trainingLoad }] = await Promise.all([
    serverApiFetchStatus<Workout[]>('/workouts'),
    serverApiFetchStatus<Activity[]>('/activities'),
    serverApiFetchStatus<TrainingLoadSeries>(`/training-load?${loadQuery.toString()}`),
  ])
  const workouts = workoutsRes.data
  const activities = activitiesRes.data
  // Sans ce signalement, une API en panne se lirait comme un mois sans séance.
  const calendarFailed = !workouts || !activities

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
      {stravaSyncFailed && (
        <p role="alert" className="panel-flat rounded-md px-4 py-3 mb-4 text-sm text-danger">
          Couldn&apos;t sync with Strava — your latest Strava activities may be missing. Refresh the page to try
          again.
        </p>
      )}
      {calendarFailed && (
        <p role="alert" className="panel-flat rounded-md px-4 py-3 mb-4 text-sm text-danger">
          Couldn&apos;t load all your workouts and activities — the calendar may be incomplete. Refresh the page to
          try again.
        </p>
      )}
      <MonthCalendar entries={entries} />

      <div className="panel rounded-lg mt-6 px-6 py-5 flex gap-10 flex-wrap">
        <Stat label="Distance" value={formatDistance(summary.distanceM)} />
        <Stat label="Time" value={formatDuration(summary.durationSec)} />
        <Stat label="Activities" value={String(summary.activityCount)} />
      </div>
      {/* Backend injoignable : le tableau de bord reste utilisable sans son
          graphe de charge plutôt que de tomber en entier. */}
      {trainingLoad && (
        <Reveal>
          <div className="mt-6">
            <TrainingLoadPanel series={trainingLoad} />
          </div>
        </Reveal>
      )}

      {/* La répartition par sport, elle, est bien en dessous : son entrée
          animée ne coûte rien à la première peinture. */}
      <Reveal>
        <MonthSportBreakdown bySport={summary.bySport} />
      </Reveal>
    </div>
  )
}
