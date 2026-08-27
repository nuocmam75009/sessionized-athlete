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

export interface WeekEntry {
  days: DayEntry[]
  distanceM: number
}

// Découpe la grille (toujours un multiple de 7, voir getMonthGridDays) en
// semaines pour le récapitulatif km affiché à droite de chaque ligne.
export function buildWeekEntries(entries: DayEntry[]): WeekEntry[] {
  const weeks: WeekEntry[] = []
  for (let i = 0; i < entries.length; i += 7) {
    const days = entries.slice(i, i + 7)
    weeks.push({ days, distanceM: days.reduce((sum, d) => sum + d.distanceM, 0) })
  }
  return weeks
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
