import { findLinkedActivityId } from './plan-format'
import { formatDateLabel, isSameCalendarDay } from './utils'
import type { Activity, Workout } from './types'

export type DayStatus = 'upcoming' | 'pending' | 'missed' | 'done' | 'unplanned' | 'empty'

export interface DayEntry {
  dateParam: string
  dateLabel: string
  weekdayLabel: string
  dayNumber: number
  isToday: boolean
  isInCurrentMonth: boolean
  workout: Workout | null
  linkedActivity: Activity | null
  unplannedActivities: Activity[]
  // Toutes les activités du jour (liée + orphelines) — base des récapitulatifs.
  activities: Activity[]
  status: DayStatus
  distanceM: number
  durationSec: number
  activityCount: number
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Semaine du lundi au dimanche, en dates locales (jamais toISOString(), qui
// décale selon le fuseau du serveur).
export function getWeekStart(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay() // 0=dim..6=sam
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Toutes les dates affichées dans la grille du mois : du lundi de la semaine
// contenant le 1er, au dimanche de la semaine contenant le dernier jour du
// mois — toujours un multiple de 7 (4 à 6 rows selon le mois).
export function getMonthGridDays(monthStart: Date): Date[] {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const gridStart = getWeekStart(monthStart)
  const gridEnd = getWeekStart(monthEnd)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const days: Date[] = []
  const cursor = new Date(gridStart)
  while (cursor.getTime() <= gridEnd.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function formatMonthLabel(monthStart: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthStart)
}

export function toDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toMonthParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// Inverse de toDateParam — construit une date locale (new Date('2026-08-04')
// serait interprété en UTC et décalerait d'un jour selon le fuseau).
function fromDateParam(param: string): Date {
  const [y, m, d] = param.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getDayStatus(args: {
  hasWorkout: boolean
  hasLinkedActivity: boolean
  hasUnplannedActivity: boolean
  isToday: boolean
  isFuture: boolean
}): DayStatus {
  const { hasWorkout, hasLinkedActivity, hasUnplannedActivity, isToday, isFuture } = args
  if (hasWorkout) {
    if (hasLinkedActivity) return 'done'
    if (isFuture) return 'upcoming'
    if (isToday) return 'pending'
    return 'missed'
  }
  return hasUnplannedActivity ? 'unplanned' : 'empty'
}

function buildDayEntry(date: Date, workouts: Workout[], activities: Activity[], today: Date, monthStart: Date): DayEntry {
  const workout = workouts.find((w) => isSameCalendarDay(new Date(w.scheduledDate), date)) ?? null
  const linkedActivityId = workout ? findLinkedActivityId(workout.id, activities) : undefined
  const linkedActivity = linkedActivityId ? (activities.find((a) => a.id === linkedActivityId) ?? null) : null
  // Calculé même quand un workout existe : sert de candidates d'assignation
  // manuelle (le sync Strava automatique ne lie qu'une seule activité par
  // jour — les autres restent orphelines et doivent être assignées à la main).
  const unplannedActivities = activities.filter((a) => !a.workoutId && isSameCalendarDay(new Date(a.startedAt), date))

  const isToday = isSameCalendarDay(date, today)
  const status = getDayStatus({
    hasWorkout: workout != null,
    hasLinkedActivity: linkedActivity != null,
    hasUnplannedActivity: unplannedActivities.length > 0,
    isToday,
    isFuture: date.getTime() > today.getTime(),
  })

  // Toute activité du jour, qu'elle soit liée à un workout ou orpheline —
  // sert aux récapitulatifs hebdo/mensuel (km, durée, nombre de séances).
  const dayActivities = linkedActivity ? [linkedActivity, ...unplannedActivities] : unplannedActivities

  return {
    dateParam: toDateParam(date),
    dateLabel: formatDateLabel(date.toISOString()),
    weekdayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
    dayNumber: date.getDate(),
    isToday,
    isInCurrentMonth: date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear(),
    workout,
    linkedActivity,
    unplannedActivities,
    activities: dayActivities,
    status,
    distanceM: dayActivities.reduce((sum, a) => sum + a.totalDistanceM, 0),
    durationSec: dayActivities.reduce((sum, a) => sum + a.totalDurationSec, 0),
    activityCount: dayActivities.length,
  }
}

export function buildMonthEntries(
  monthStart: Date,
  workouts: Workout[],
  activities: Activity[],
  now: Date = new Date(),
): DayEntry[] {
  const today = startOfDay(now)
  return getMonthGridDays(monthStart).map((date) => buildDayEntry(date, workouts, activities, today, monthStart))
}

// Répartition par sport d'une semaine — le sport vient de Strava/FIT et peut
// être null (regroupé sous "Other").
export interface SportBreakdown {
  sport: string
  activityCount: number
  distanceM: number
  durationSec: number
}

export interface WeekSummary {
  distanceM: number
  durationSec: number
  elevationGainM: number
  activityCount: number
  activeDays: number
  longestActivityM: number
  avgPaceSecPerKm: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  totalCalories: number | null
  plannedCount: number
  doneCount: number
  missedCount: number
  upcomingCount: number
  unplannedCount: number
  bySport: SportBreakdown[]
}

export interface WeekEntry {
  days: DayEntry[]
  startDateParam: string
  endDateParam: string
  label: string
  // Version compacte pour la case de la grille, où la place est comptée.
  shortLabel: string
  containsToday: boolean
  summary: WeekSummary
}

function buildSportBreakdown(activities: Activity[]): SportBreakdown[] {
  const bySport = new Map<string, SportBreakdown>()
  for (const activity of activities) {
    const sport = activity.sport ?? 'Other'
    const current = bySport.get(sport) ?? { sport, activityCount: 0, distanceM: 0, durationSec: 0 }
    current.activityCount += 1
    current.distanceM += activity.totalDistanceM
    current.durationSec += activity.totalDurationSec
    bySport.set(sport, current)
  }
  return [...bySport.values()].sort((a, b) => b.distanceM - a.distanceM)
}

function buildWeekSummary(days: DayEntry[]): WeekSummary {
  const activities = days.flatMap((d) => d.activities)
  const distanceM = activities.reduce((sum, a) => sum + a.totalDistanceM, 0)
  const durationSec = activities.reduce((sum, a) => sum + a.totalDurationSec, 0)

  // FC moyenne pondérée par la durée : une sortie longue doit peser plus dans
  // la moyenne de la semaine qu'un footing de vingt minutes.
  const hrActivities = activities.filter((a) => a.avgHeartRate != null)
  const hrDurationSec = hrActivities.reduce((sum, a) => sum + a.totalDurationSec, 0)
  const hrWeightedSum = hrActivities.reduce((sum, a) => sum + (a.avgHeartRate ?? 0) * a.totalDurationSec, 0)

  const maxHeartRates = activities.map((a) => a.maxHeartRate).filter((v): v is number => v != null)
  const calories = activities.map((a) => a.totalCalories).filter((v): v is number => v != null)

  return {
    distanceM,
    durationSec,
    elevationGainM: activities.reduce((sum, a) => sum + (a.elevationGainM ?? 0), 0),
    activityCount: activities.length,
    activeDays: days.filter((d) => d.activities.length > 0).length,
    longestActivityM: activities.reduce((max, a) => Math.max(max, a.totalDistanceM), 0),
    avgPaceSecPerKm: distanceM > 0 && durationSec > 0 ? Math.round(durationSec / (distanceM / 1000)) : null,
    avgHeartRate: hrDurationSec > 0 ? Math.round(hrWeightedSum / hrDurationSec) : null,
    maxHeartRate: maxHeartRates.length > 0 ? Math.max(...maxHeartRates) : null,
    totalCalories: calories.length > 0 ? Math.round(calories.reduce((sum, c) => sum + c, 0)) : null,
    plannedCount: days.filter((d) => d.workout != null).length,
    doneCount: days.filter((d) => d.status === 'done').length,
    missedCount: days.filter((d) => d.status === 'missed').length,
    upcomingCount: days.filter((d) => d.status === 'upcoming' || d.status === 'pending').length,
    unplannedCount: activities.filter((a) => !a.workoutId).length,
    bySport: buildSportBreakdown(activities),
  }
}

// "Aug 4 – Aug 10" — libellé de la semaine, titre de son récapitulatif.
export function formatWeekRangeLabel(startDateParam: string, endDateParam: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${formatter.format(fromDateParam(startDateParam))} – ${formatter.format(fromDateParam(endDateParam))}`
}

// "Aug 4–10", ou "Aug 30–Sep 5" à cheval sur deux mois — le mois n'est répété
// que lorsqu'il change.
export function formatWeekShortLabel(startDateParam: string, endDateParam: string): string {
  const start = fromDateParam(startDateParam)
  const end = fromDateParam(endDateParam)
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  if (start.getMonth() === end.getMonth()) return `${formatter.format(start)}–${end.getDate()}`
  return `${formatter.format(start)}–${formatter.format(end)}`
}

// Découpe la grille (toujours un multiple de 7, voir getMonthGridDays) en
// semaines pour le récapitulatif affiché à droite de chaque ligne. Contrairement
// à buildMonthSummary, une semaine compte ses 7 jours affichés — y compris ceux
// qui débordent sur le mois voisin.
export function buildWeekEntries(entries: DayEntry[]): WeekEntry[] {
  const weeks: WeekEntry[] = []
  for (let i = 0; i < entries.length; i += 7) {
    const days = entries.slice(i, i + 7)
    const startDateParam = days[0].dateParam
    const endDateParam = days[days.length - 1].dateParam
    weeks.push({
      days,
      startDateParam,
      endDateParam,
      label: formatWeekRangeLabel(startDateParam, endDateParam),
      shortLabel: formatWeekShortLabel(startDateParam, endDateParam),
      containsToday: days.some((d) => d.isToday),
      summary: buildWeekSummary(days),
    })
  }
  return weeks
}

// Semaine sélectionnée par défaut dans le récapitulatif : celle du jour quand
// on regarde le mois courant, sinon la première du mois affiché (la grille
// commence toujours par la semaine contenant le 1er).
export function findDefaultWeekIndex(weeks: WeekEntry[]): number {
  const todayIndex = weeks.findIndex((w) => w.containsToday)
  return todayIndex >= 0 ? todayIndex : 0
}

export interface MonthSummary {
  distanceM: number
  durationSec: number
  activityCount: number
}

// Contrairement à buildWeekEntries, ne compte que les jours du mois affiché
// (isInCurrentMonth) — les jours de padding des mois voisins ne comptent pas.
export function buildMonthSummary(entries: DayEntry[]): MonthSummary {
  const monthDays = entries.filter((d) => d.isInCurrentMonth)
  return {
    distanceM: monthDays.reduce((sum, d) => sum + d.distanceM, 0),
    durationSec: monthDays.reduce((sum, d) => sum + d.durationSec, 0),
    activityCount: monthDays.reduce((sum, d) => sum + d.activityCount, 0),
  }
}

export function dayStatusStyles(status: DayStatus): {
  dotClass: string
  bgClass: string
  borderClass: string
  label: string
} {
  switch (status) {
    case 'done':
      return { dotClass: 'bg-green-500', bgClass: 'bg-green-50/70', borderClass: 'border-divider/60', label: 'Done' }
    case 'missed':
      return { dotClass: 'bg-red-500', bgClass: 'bg-red-50/70', borderClass: 'border-divider/60', label: 'Missed' }
    case 'pending':
      return {
        dotClass: 'bg-accent',
        bgClass: 'bg-accent-100/70',
        borderClass: 'border-divider/60',
        label: 'Today',
      }
    case 'upcoming':
      return { dotClass: 'bg-accent-300', bgClass: 'bg-bg', borderClass: 'border-divider/60', label: 'Upcoming' }
    case 'unplanned':
      return {
        dotClass: 'bg-neutral-400',
        bgClass: 'bg-neutral-100/70',
        borderClass: 'border-divider/60',
        label: 'Unplanned',
      }
    case 'empty':
      return { dotClass: '', bgClass: 'bg-bg', borderClass: 'border-dashed border-divider', label: '' }
  }
}

// "2026-08-24" -> "2026-08-24T00:00:00+02:00" (offset local du navigateur).
// GET /activities/hr-zones refuse une date seule : sans heure ni offset, la
// période serait interprétée dans le fuseau du serveur. L'offset est recalculé
// pour chaque borne, donc une semaine à cheval sur un changement d'heure reste
// correcte.
export function toIsoDateTimeWithOffset(dateParam: string, bound: 'start' | 'end'): string {
  const date = fromDateParam(dateParam)
  if (bound === 'end') date.setHours(23, 59, 59, 0)

  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMin)
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

  return `${dateParam}T${time}${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`
}
