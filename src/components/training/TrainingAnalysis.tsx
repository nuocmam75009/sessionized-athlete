'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SportIcon } from '@/components/ui/SportIcon'
import { tdClass, thClass } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import { sportColor } from '@/lib/sport'
import {
  buildProgressionGroups,
  buildTrainingSessions,
  defaultProgressionGroup,
  groupTrend,
  paceDeltas,
  summarizeTrainings,
  TRAINING_PERIODS,
  type ProgressionGroup,
  type RepStats,
  type TrainingPeriod,
  type TrainingSession,
} from '@/lib/training-analysis'
import { formatDecimal, formatDuration, formatPace, formatPercent, formatShortDate } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

// Recharts chargé à la demande, comme les autres graphes : il ne retarde pas
// l'affichage des chiffres et du tableau, qui portent déjà toute l'information.
const TrainingPaceChart = dynamic(
  () => import('@/components/charts/TrainingPaceChart').then((m) => m.TrainingPaceChart),
  { ssr: false, loading: () => <div className="h-60" /> },
)

// Analyse des séances de qualité : fréquence, temps en répétitions, puis
// progression de l'allure entre séances comparables. Le tableau final est le
// double lisible du graphe (chaque point y figure, avec son écart).
//
// `now` vient du serveur : borner les périodes avec l'heure du rendu serveur
// et non celle du navigateur garde le même résultat des deux côtés.
export function TrainingAnalysis({
  activities,
  workouts,
  now: nowIso,
}: {
  activities: Activity[]
  workouts: Workout[]
  now: string
}) {
  const { locale, t } = useI18n()
  const [period, setPeriod] = useState<TrainingPeriod>('12w')
  // Groupe choisi, mémorisé par sa clé : absent d'une autre période, on
  // retombe sur le plus fourni sans oublier le choix.
  const [groupKey, setGroupKey] = useState<string | null>(null)

  const now = new Date(nowIso)
  const sessions = buildTrainingSessions(activities, workouts, period, now)
  const summary = summarizeTrainings(sessions, activities, period, now)
  const groups = buildProgressionGroups(sessions)
  const group = groups.find((g) => g.key === groupKey) ?? defaultProgressionGroup(groups)
  const deltas = paceDeltas(groups)
  const ta = t.trainingAnalysis

  return (
    <div>
      <SegmentedControl
        name="training-period"
        ariaLabel={ta.period}
        value={period}
        onChange={setPeriod}
        options={TRAINING_PERIODS.map((p) => ({ value: p, label: ta.periods[p] }))}
      />

      {sessions.length === 0 ? (
        <p className="panel rounded-lg mt-6 px-6 py-5 text-sm text-text/60 max-w-[60ch]">{ta.empty}</p>
      ) : (
        <>
          <div className="panel rounded-lg mt-6 px-6 py-5 flex gap-10 flex-wrap">
            <Kpi label={ta.sessions} value={String(summary.sessionCount)} />
            <Kpi
              label={ta.perWeek}
              value={summary.perWeek != null ? formatDecimal(summary.perWeek, 1, locale) : '—'}
            />
            <Kpi label={ta.timeInReps} value={summary.workDurationSec > 0 ? formatDuration(summary.workDurationSec) : '—'} />
            <Kpi
              label={ta.share}
              value={summary.share != null ? formatPercent(summary.share, locale) : '—'}
              detail={ta.shareDetail(summary.activityCount)}
            />
          </div>

          {group && <Progression groups={groups} group={group} onSelect={setGroupKey} />}

          <section className="mt-8">
            <h2 className="section-title mb-3">{ta.list}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>{ta.date}</th>
                    <th className={thClass}>{ta.session}</th>
                    <th className={thClass}>{ta.reps}</th>
                    <th className={thClass}>{ta.repPace}</th>
                    <th className={thClass}>{ta.change}</th>
                    <th className={thClass}>{ta.repHr}</th>
                    <th className={thClass}>{ta.effort}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* La plus récente en tête : c'est celle qu'on vient de courir. */}
                  {[...sessions].reverse().map((session) => (
                    <SessionRow key={session.activity.id} session={session} delta={deltas.get(session.activity.id)} />
                  ))}
                </tbody>
              </table>
            </div>
            {summary.unstructuredCount > 0 && (
              <p className="text-xs text-text/60 mt-3">{ta.noStructure(summary.unstructuredCount)}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.11em] text-text/60">{label}</div>
      <div className="metric mt-1.5 font-semibold leading-none text-[26px]">{value}</div>
      {detail && <div className="text-[11px] text-text/60 mt-1.5">{detail}</div>}
    </div>
  )
}

function repsLabel(reps: RepStats): string {
  return `${reps.count} × ${formatDuration(Math.round(reps.avgDurationSec))}`
}

function Progression({
  groups,
  group,
  onSelect,
}: {
  groups: ProgressionGroup[]
  group: ProgressionGroup
  onSelect: (key: string) => void
}) {
  const { t } = useI18n()
  const ta = t.trainingAnalysis
  // Le sport ne précède le format que si plusieurs sports sont en jeu.
  const severalSports = new Set(groups.map((g) => g.kind)).size > 1
  const groupLabel = (g: ProgressionGroup) =>
    severalSports ? `${t.sports[g.kind]} · ${ta.formats[g.format]}` : ta.formats[g.format]

  const { latest, previousPaceSecPerKm, previousHeartRate } = groupTrend(group)
  const latestHeartRate = latest.reps.avgHeartRate

  return (
    <section className="panel rounded-lg mt-6 px-6 py-5">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <h2 className="section-title mb-0">
          {ta.progression} · {groupLabel(group)}
        </h2>
        {groups.length > 1 && (
          <SegmentedControl
            name="training-group"
            ariaLabel={ta.group}
            value={group.key}
            onChange={onSelect}
            options={groups.map((g) => ({ value: g.key, label: groupLabel(g) }))}
          />
        )}
      </div>

      <div className="flex gap-10 flex-wrap mb-5">
        <Kpi
          label={ta.lastSession}
          value={formatPace(latest.reps.paceSecPerKm)}
          detail={
            previousPaceSecPerKm != null
              ? ta.paceVsPrevious(latest.reps.paceSecPerKm - previousPaceSecPerKm, formatPace(previousPaceSecPerKm))
              : ta.firstOfFormat
          }
        />
        <Kpi
          label={ta.repHeartRate}
          value={latestHeartRate != null ? `${latestHeartRate} bpm` : '—'}
          detail={
            latestHeartRate != null && previousHeartRate != null
              ? ta.heartRateVsPrevious(latestHeartRate - previousHeartRate, `${previousHeartRate} bpm`)
              : undefined
          }
        />
      </div>

      {group.sessions.length > 1 ? (
        <TrainingPaceChart
          points={group.sessions.map((s) => ({
            id: s.activity.id,
            time: new Date(s.activity.startedAt).getTime(),
            startedAt: s.activity.startedAt,
            pace: s.reps.paceSecPerKm,
            heartRate: s.reps.avgHeartRate,
            title: s.workoutTitle ?? t.sports[s.kind],
            reps: repsLabel(s.reps),
          }))}
        />
      ) : (
        <p className="text-sm text-text/60">{ta.singleSession}</p>
      )}

      <p className="text-xs text-text/60 mt-4 max-w-[70ch]">{ta.formatsHint}</p>
    </section>
  )
}

function SessionRow({ session, delta }: { session: TrainingSession; delta: number | undefined }) {
  const { locale, t } = useI18n()
  const ta = t.trainingAnalysis
  const { activity, reps, kind } = session

  return (
    <tr>
      <td className={`${tdClass} metric text-text/60 whitespace-nowrap`}>{formatShortDate(activity.startedAt, locale)}</td>
      <td className={tdClass}>
        <Link
          href={`/activities/${activity.id}`}
          className="inline-flex items-center gap-2 hover:text-accent transition-colors"
        >
          <SportIcon kind={kind} className="shrink-0" style={{ color: sportColor(kind) }} />
          {session.workoutTitle ?? t.sports[kind]}
        </Link>
      </td>
      <td className={`${tdClass} metric whitespace-nowrap`}>{reps ? repsLabel(reps) : '—'}</td>
      <td className={`${tdClass} metric whitespace-nowrap`}>
        {reps?.paceSecPerKm != null ? formatPace(reps.paceSecPerKm) : '—'}
      </td>
      <td className={`${tdClass} metric whitespace-nowrap`}>{delta != null ? <PaceDelta delta={delta} /> : '—'}</td>
      <td className={`${tdClass} metric whitespace-nowrap`}>
        {reps?.avgHeartRate != null ? `${reps.avgHeartRate} bpm` : '—'}
      </td>
      <td className={`${tdClass} metric text-text/60`}>
        {activity.difficultyNote != null ? `${activity.difficultyNote}/10` : '—'}
      </td>
    </tr>
  )
}

// Écart avec la séance précédente du même groupe. Le signe porte
// l'information, la couleur ne fait que la doubler ; le lecteur d'écran entend
// la phrase complète plutôt que « moins sept secondes ».
function PaceDelta({ delta }: { delta: number }): ReactNode {
  const { t } = useI18n()
  const visible = delta === 0 ? '=' : `${delta < 0 ? '−' : '+'}${Math.abs(delta)}"`
  return (
    <>
      <span aria-hidden className={delta < 0 ? 'text-success' : 'text-text/60'}>
        {visible}
      </span>
      <span className="sr-only">{t.trainingAnalysis.paceChange(delta)}</span>
    </>
  )
}
