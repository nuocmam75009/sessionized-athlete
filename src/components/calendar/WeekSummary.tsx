'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SportIcon } from '@/components/ui/SportIcon'
import { Stat } from '@/components/ui/Stat'
import { SportBreakdownTable } from './SportBreakdownTable'
import { WeekHeartRateZones } from './WeekHeartRateZones'
import { useI18n } from '@/hooks/useI18n'
import { formatActivity } from '@/lib/activity-format'
import {
  dayStatusStyles,
  formatWeekdayLabel,
  formatWeekRangeLabel,
  summarizeWeekActivities,
  type DayEntry,
  type WeekEntry,
} from '@/lib/calendar'
import { isFootSport, sportColor, toSportKind, type SportKind } from '@/lib/sport'
import { formatDistance, formatDuration, formatPace } from '@/lib/utils'
import type { Activity } from '@/lib/types'

type SportFilter = SportKind | 'all'

// Récapitulatif de la semaine sélectionnée dans le calendrier, affiché en
// permanence à côté de celui-ci (la semaine du jour au chargement). Tout est
// calculé à partir des activités déjà chargées, sauf la répartition par zone
// de FC qui vient d'une agrégation serveur (voir WeekHeartRateZones).
export function WeekSummary({ week, className = '' }: { week: WeekEntry; className?: string }) {
  const { locale, t } = useI18n()
  const { summary } = week
  const detailedDays = week.days.filter((d) => d.activities.length > 0 || d.workout != null)

  // Filtre par sport des sections Volume et Physio, proposé dès que la semaine
  // mélange deux sports. Le choix survit au changement de semaine (le panneau
  // n'est pas remonté), pour suivre la course d'une semaine à l'autre ; une
  // semaine qui ne compte pas ce sport retombe sur « Tous » sans l'oublier.
  const [sportFilter, setSportFilter] = useState<SportFilter>('all')
  const showSportFilter = summary.bySport.length > 1
  const activeSport: SportFilter =
    showSportFilter && summary.bySport.some((s) => s.kind === sportFilter) ? sportFilter : 'all'
  const totals = activeSport === 'all' ? summary : summarizeWeekActivities(week.days, activeSport)

  return (
    <aside className={`panel rounded-lg p-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="font-heading font-semibold text-[10px] tracking-[0.16em] uppercase text-accent">
          {t.weekSummary.eyebrow}
        </div>
        {week.containsToday && (
          <span className="text-[9px] uppercase tracking-[0.11em] text-text/60 rounded-sm px-2 py-1 ring-1 ring-inset ring-divider">
            {t.weekSummary.thisWeek}
          </span>
        )}
      </div>
      {/* h2 : première section sous le h1 du mois ; taille d'un h3. */}
      <h2 className="mb-1 text-[1.2rem] leading-[1.2] tracking-[-0.02em]">
        {formatWeekRangeLabel(week.startDateParam, week.endDateParam, locale)}
      </h2>
      <p className="text-sm text-text/60 mb-6">{t.weekSummary.activeDays(summary.activeDays)}</p>

      {summary.activityCount === 0 && summary.plannedCount === 0 ? (
        <p className="text-text/60 text-sm">{t.weekSummary.empty}</p>
      ) : (
        <>
          {showSportFilter && (
            <div className="mb-6">
              <SegmentedControl
                name="week-sport"
                ariaLabel={t.weekSummary.sportFilter}
                value={activeSport}
                onChange={setSportFilter}
                options={[
                  { value: 'all', label: t.weekSummary.allSports },
                  ...summary.bySport.map((s) => ({
                    value: s.kind,
                    label: t.sports[s.kind],
                    icon: <SportIcon kind={s.kind} size={14} className="shrink-0" />,
                  })),
                ]}
              />
            </div>
          )}

          <Section title={t.weekSummary.volume}>
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              {/* « — » plutôt que « 0.0 km » : une semaine de renforcement n'a
                  pas de distance, elle n'en a pas une nulle. */}
              <Stat
                size="sm"
                label={t.stats.distance}
                value={totals.distanceM > 0 ? formatDistance(totals.distanceM, locale) : '—'}
              />
              <Stat size="sm" label={t.stats.time} value={formatDuration(Math.round(totals.durationSec))} />
              <Stat size="sm" label={t.stats.activities} value={String(totals.activityCount)} />
              <Stat
                size="sm"
                label={t.stats.avgPace}
                value={totals.avgPaceSecPerKm != null ? formatPace(totals.avgPaceSecPerKm) : '—'}
              />
              <Stat
                size="sm"
                label={t.stats.longest}
                value={totals.longestActivityM > 0 ? formatDistance(totals.longestActivityM, locale) : '—'}
              />
              <Stat
                size="sm"
                label={t.stats.elevation}
                value={totals.elevationGainM > 0 ? `${Math.round(totals.elevationGainM)} m` : '—'}
              />
            </div>
          </Section>

          <Section title={t.weekSummary.physio}>
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              <Stat
                size="sm"
                label={t.stats.avgHr}
                value={totals.avgHeartRate != null ? `${totals.avgHeartRate} bpm` : '—'}
              />
              <Stat
                size="sm"
                label={t.stats.maxHr}
                value={totals.maxHeartRate != null ? `${totals.maxHeartRate} bpm` : '—'}
              />
              <Stat
                size="sm"
                label={t.stats.calories}
                value={totals.totalCalories != null ? `${totals.totalCalories} kcal` : '—'}
              />
            </div>
          </Section>

          {summary.activityCount > 0 && (
            <Section title={t.weekSummary.heartRateZones}>
              {/* L'agrégation serveur ne connaît pas nos catégories de sport
                  (normalisées côté front, voir toSportKind) : elle reste sur
                  toute la semaine, et le dit quand un sport est sélectionné. */}
              {activeSport !== 'all' && <p className="text-xs text-text/60 mb-3">{t.weekSummary.zonesAllSports}</p>}
              {/* Remonté par période : la key force un composant neuf par
                  semaine plutôt qu'un refetch sur une instance vivante. */}
              <WeekHeartRateZones key={week.startDateParam} week={week} />
            </Section>
          )}

          <Section title={t.weekSummary.plan}>
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              <Stat size="sm" label={t.weekSummary.planned} value={String(summary.plannedCount)} />
              <Stat size="sm" label={t.weekSummary.done} value={String(summary.doneCount)} />
              <Stat size="sm" label={t.weekSummary.missed} value={String(summary.missedCount)} />
              <Stat size="sm" label={t.weekSummary.toCome} value={String(summary.upcomingCount)} />
            </div>
            {summary.unplannedCount > 0 && (
              <p className="text-sm text-text/60 mt-3">{t.weekSummary.unplanned(summary.unplannedCount)}</p>
            )}
          </Section>

          {summary.bySport.length > 0 && (
            <Section title={t.weekSummary.bySport}>
              <SportBreakdownTable bySport={summary.bySport} />
            </Section>
          )}

          {detailedDays.length > 0 && (
            <Section title={t.weekSummary.dayByDay}>
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
      {/* Style d'étiquette (capitales sourdes) de .section-title, globals.css ;
          h3 sous le h2 de la semaine. */}
      <h3 className="section-title mb-3 pb-2 border-b border-divider">{title}</h3>
      {children}
    </section>
  )
}

// Une ligne d'activité du détail de la semaine : icône du sport, sport, puis
// les métriques qui ont un sens pour ce sport (pas d'allure min/km à vélo, pas
// de distance sur une séance de renforcement).
function ActivityRow({ activity }: { activity: Activity }) {
  const { locale, t } = useI18n()
  const kind = toSportKind(activity.sport)
  const { distance, duration, pace } = formatActivity(activity, locale)

  const metrics = [
    activity.totalDistanceM > 0 ? distance : null,
    duration,
    isFootSport(kind) && activity.totalDistanceM > 0 ? pace : null,
  ].filter((metric): metric is string => metric != null)

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="flex items-center gap-2 text-sm text-text/60 hover:text-accent transition-colors"
    >
      <SportIcon kind={kind} className="shrink-0" style={{ color: sportColor(kind) }} />
      <span className="min-w-0 truncate">
        <span className="text-text/80">{t.sports[kind]}</span> · {metrics.join(' · ')}
      </span>
    </Link>
  )
}

function DayRow({ day }: { day: DayEntry }) {
  const { locale, t } = useI18n()
  const { dotClass } = dayStatusStyles(day.status)

  return (
    <div className="panel-flat rounded-md px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="font-heading font-semibold text-[13px] tracking-[-0.01em]">
          {formatWeekdayLabel(day.dateParam, locale)} {day.dayNumber}
        </span>
        {day.status !== 'empty' && (
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] text-text/60">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {t.calendar.status[day.status]}
          </span>
        )}
      </div>

      {day.workout && <div className="text-sm mb-1">{day.workout.title}</div>}

      {day.activities.length === 0 ? (
        <div className="text-sm text-text/60">{t.weekSummary.noActivity}</div>
      ) : (
        <div className="grid gap-1">
          {day.activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}
