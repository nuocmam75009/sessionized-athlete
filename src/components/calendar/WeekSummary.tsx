'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Stat } from '@/components/ui/Stat'
import { tdClass, thClass } from '@/components/ui/table'
import { WeekHeartRateZones } from './WeekHeartRateZones'
import { formatActivity } from '@/lib/activity-format'
import { dayStatusStyles, type DayEntry, type WeekEntry } from '@/lib/calendar'
import { formatDistance, formatDuration, formatPace } from '@/lib/utils'

// Récapitulatif de la semaine sélectionnée dans le calendrier, affiché en
// permanence à côté de celui-ci (la semaine du jour au chargement). Tout est
// calculé à partir des activités déjà chargées, sauf la répartition par zone
// de FC qui vient d'une agrégation serveur (voir WeekHeartRateZones).
export function WeekSummary({ week, className = '' }: { week: WeekEntry; className?: string }) {
  const { summary } = week
  const detailedDays = week.days.filter((d) => d.activities.length > 0 || d.workout != null)

  return (
    <aside className={`bg-surface rounded-md p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="font-heading font-semibold text-xs tracking-[0.1em] uppercase text-accent">Week summary</div>
        {week.containsToday && (
          <span className="text-[10px] uppercase tracking-wide text-text/45">This week</span>
        )}
      </div>
      <h3 className="mb-1">{week.label}</h3>
      <p className="text-sm text-text/60 mb-5">
        {summary.activeDays} active day{summary.activeDays === 1 ? '' : 's'} out of 7
      </p>

      {summary.activityCount === 0 && summary.plannedCount === 0 ? (
        <p className="text-text/60 text-sm">Aucune séance ni activité sur cette semaine.</p>
      ) : (
        <>
          <Section title="Volume">
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              <Stat size="sm" label="Distance" value={formatDistance(summary.distanceM)} />
              <Stat size="sm" label="Time" value={formatDuration(Math.round(summary.durationSec))} />
              <Stat size="sm" label="Activities" value={String(summary.activityCount)} />
              <Stat
                size="sm"
                label="Avg pace"
                value={summary.avgPaceSecPerKm != null ? formatPace(summary.avgPaceSecPerKm) : '—'}
              />
              <Stat
                size="sm"
                label="Longest"
                value={summary.longestActivityM > 0 ? formatDistance(summary.longestActivityM) : '—'}
              />
              <Stat
                size="sm"
                label="Elevation"
                value={summary.elevationGainM > 0 ? `${Math.round(summary.elevationGainM)} m` : '—'}
              />
            </div>
          </Section>

          <Section title="Physio">
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              <Stat size="sm" label="Avg HR" value={summary.avgHeartRate != null ? `${summary.avgHeartRate} bpm` : '—'} />
              <Stat size="sm" label="Max HR" value={summary.maxHeartRate != null ? `${summary.maxHeartRate} bpm` : '—'} />
              <Stat
                size="sm"
                label="Calories"
                value={summary.totalCalories != null ? `${summary.totalCalories} kcal` : '—'}
              />
            </div>
          </Section>

          {summary.activityCount > 0 && (
            <Section title="Heart rate zones">
              {/* Remonté par période : la key force un composant neuf par
                  semaine plutôt qu'un refetch sur une instance vivante. */}
              <WeekHeartRateZones key={week.startDateParam} week={week} />
            </Section>
          )}

          <Section title="Plan">
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              <Stat size="sm" label="Planned" value={String(summary.plannedCount)} />
              <Stat size="sm" label="Done" value={String(summary.doneCount)} />
              <Stat size="sm" label="Missed" value={String(summary.missedCount)} />
              <Stat size="sm" label="To come" value={String(summary.upcomingCount)} />
            </div>
            {summary.unplannedCount > 0 && (
              <p className="text-sm text-text/60 mt-3">
                {summary.unplannedCount} unplanned activit{summary.unplannedCount === 1 ? 'y' : 'ies'} — not linked to a
                workout.
              </p>
            )}
          </Section>

          {summary.bySport.length > 0 && (
            <Section title="By sport">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>Sport</th>
                    <th className={thClass}>Sessions</th>
                    <th className={thClass}>Distance</th>
                    <th className={thClass}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.bySport.map((entry) => (
                    <tr key={entry.sport}>
                      <td className={tdClass}>{entry.sport}</td>
                      <td className={`${tdClass} text-text/60`}>{entry.activityCount}</td>
                      <td className={tdClass}>{formatDistance(entry.distanceM)}</td>
                      <td className={tdClass}>{formatDuration(Math.round(entry.durationSec))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {detailedDays.length > 0 && (
            <Section title="Day by day">
              <div className="grid gap-2">
                {detailedDays.map((day) => (
                  <DayRow key={day.dateParam} day={day} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h4 className="text-[11px] uppercase tracking-[0.08em] text-text/55 mb-3 pb-2 border-b border-divider">
        {title}
      </h4>
      {children}
    </section>
  )
}

function DayRow({ day }: { day: DayEntry }) {
  const { dotClass, label } = dayStatusStyles(day.status)

  return (
    <div className="border border-divider rounded-md px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="font-heading font-semibold text-sm">
          {day.weekdayLabel} {day.dayNumber}
        </span>
        {dotClass && (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-text/50">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {label}
          </span>
        )}
      </div>

      {day.workout && <div className="text-sm mb-1">{day.workout.title}</div>}

      {day.activities.length === 0 ? (
        <div className="text-sm text-text/50">No activity recorded</div>
      ) : (
        <div className="grid gap-0.5">
          {day.activities.map((activity) => {
            const actual = formatActivity(activity)
            return (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                className="text-sm text-text/60 hover:text-accent transition-colors"
              >
                {activity.sport ?? 'Activity'} · {actual.distance} · {actual.duration} · {actual.pace}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
