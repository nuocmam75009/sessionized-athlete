import { isWorkLap, sortLaps, summarizeLaps } from './pace-chart'
import { findLinkedWorkout } from './plan-format'
import { isFootSport, toSportKind, type SportKind } from './sport'
import type { Activity, Lap, Workout } from './types'

// Analyse des séances de qualité (Activity.training) : fréquence, temps passé
// à l'effort et progression de l'allure des répétitions. Aucune structure ne
// porte de libellé : tout est formaté à l'affichage, dans la langue courante.

export type TrainingPeriod = '12w' | '6m' | 'all'
export const TRAINING_PERIODS: readonly TrainingPeriod[] = ['12w', '6m', 'all']

const DAY_MS = 24 * 60 * 60 * 1000
const PERIOD_DAYS: Record<TrainingPeriod, number> = { '12w': 84, '6m': 182, all: Number.POSITIVE_INFINITY }

// Format des répétitions, d'après leur durée moyenne. Comparer l'allure d'un
// 10 × 400 m à celle d'un 3 × 10 min au seuil ne dit rien d'une progression :
// on ne compare que des séances du même format. Sous 2 min, ce sont des
// répétitions courtes (300 à 600 m) ; à partir de 6 min, des longues (seuil,
// 2000 m et plus) ; entre les deux, les 800 m à 1500 m.
export type RepFormat = 'short' | 'medium' | 'long'
export const REP_FORMATS: readonly RepFormat[] = ['short', 'medium', 'long']
const SHORT_REP_MAX_SEC = 120
const LONG_REP_MIN_SEC = 360

export function repFormat(avgRepDurationSec: number): RepFormat {
  if (avgRepDurationSec < SHORT_REP_MAX_SEC) return 'short'
  if (avgRepDurationSec < LONG_REP_MIN_SEC) return 'medium'
  return 'long'
}

export interface RepStats {
  count: number
  avgDurationSec: number
  workDurationSec: number
  workDistanceM: number
  // null hors sport à pied : une allure min/km à vélo induit en erreur.
  paceSecPerKm: number | null
  avgHeartRate: number | null
  format: RepFormat
}

export interface TrainingSession {
  activity: Activity
  workoutTitle: string | null
  kind: SportKind
  // null : les laps ne séparent pas l'effort du reste (voir qualityWorkLaps).
  // La séance compte dans la fréquence, pas dans la progression.
  reps: RepStats | null
}

export type PacedSession = TrainingSession & { reps: RepStats & { paceSecPerKm: number } }

function isPaced(session: TrainingSession): session is PacedSession {
  return session.reps?.paceSecPerKm != null
}

/**
 * Laps d'effort d'une séance marquée training. Le flag dit déjà qu'il s'agit
 * d'une séance de qualité : contrairement à workLapIds (pace-chart.ts), on
 * n'exige pas de récupération entre les laps, qu'un seuil continu
 * (échauffement, 20 min, retour au calme) n'a pas. Il faut seulement que
 * l'effort se distingue du reste : des laps tous en effort sont un découpage
 * automatique au kilomètre, pas des répétitions.
 */
export function qualityWorkLaps(laps: readonly Lap[]): Lap[] {
  const work = sortLaps(laps).filter(isWorkLap)
  return work.length > 0 && work.length < laps.length ? work : []
}

function analyzeSession(activity: Activity, workouts: Workout[]): TrainingSession {
  const kind = toSportKind(activity.sport)
  const work = qualityWorkLaps(activity.laps)
  const summary = work.length > 0 ? summarizeLaps(work) : null
  const reps =
    summary && summary.durationSec > 0
      ? {
          count: summary.count,
          avgDurationSec: summary.durationSec / summary.count,
          workDurationSec: summary.durationSec,
          workDistanceM: summary.distanceM,
          paceSecPerKm:
            isFootSport(kind) && summary.paceSecPerKm != null ? Math.round(summary.paceSecPerKm) : null,
          avgHeartRate: summary.avgHeartRate,
          format: repFormat(summary.durationSec / summary.count),
        }
      : null

  return { activity, workoutTitle: findLinkedWorkout(activity, workouts)?.title ?? null, kind, reps }
}

function startedAtMs(activity: Activity): number {
  return new Date(activity.startedAt).getTime()
}

function periodStartMs(period: TrainingPeriod, now: Date): number {
  return now.getTime() - PERIOD_DAYS[period] * DAY_MS
}

function inPeriod(activity: Activity, period: TrainingPeriod, now: Date): boolean {
  return startedAtMs(activity) >= periodStartMs(period, now)
}

/** Séances de qualité de la période, de la plus ancienne à la plus récente. */
export function buildTrainingSessions(
  activities: Activity[],
  workouts: Workout[],
  period: TrainingPeriod,
  now: Date = new Date(),
): TrainingSession[] {
  return activities
    .filter((a) => a.training && inPeriod(a, period, now))
    .sort((a, b) => startedAtMs(a) - startedAtMs(b))
    .map((a) => analyzeSession(a, workouts))
}

export interface TrainingSummary {
  sessionCount: number
  // Toutes les activités de la période, séances de qualité comprises.
  activityCount: number
  perWeek: number | null
  // Temps passé dans les répétitions, échauffement et récupérations exclus.
  workDurationSec: number
  // Part des séances de qualité parmi les activités de la période (0 à 1).
  share: number | null
  // Séances dont les laps ne séparent pas l'effort du reste.
  unstructuredCount: number
}

export function summarizeTrainings(
  sessions: TrainingSession[],
  activities: Activity[],
  period: TrainingPeriod,
  now: Date = new Date(),
): TrainingSummary {
  const periodActivities = activities.filter((a) => inPeriod(a, period, now))
  const firstMs = periodActivities.length > 0 ? Math.min(...periodActivities.map(startedAtMs)) : null
  // Semaines couvertes : la période, ou moins si l'historique est plus court.
  // Un athlète arrivé il y a trois semaines ne doit pas voir sa fréquence
  // divisée par douze.
  const weeks =
    firstMs != null ? Math.max(1, (now.getTime() - Math.max(periodStartMs(period, now), firstMs)) / (7 * DAY_MS)) : null

  return {
    sessionCount: sessions.length,
    activityCount: periodActivities.length,
    perWeek: weeks != null ? sessions.length / weeks : null,
    workDurationSec: sessions.reduce((sum, s) => sum + (s.reps?.workDurationSec ?? 0), 0),
    share: periodActivities.length > 0 ? sessions.length / periodActivities.length : null,
    unstructuredCount: sessions.filter((s) => s.reps == null).length,
  }
}

// Séances comparables entre elles : même sport, même format de répétitions.
export interface ProgressionGroup {
  key: string
  kind: SportKind
  format: RepFormat
  // Dans l'ordre chronologique, toutes avec une allure de répétition.
  sessions: PacedSession[]
}

/** Groupes de progression, par sport puis du format le plus court au plus long. */
export function buildProgressionGroups(sessions: TrainingSession[]): ProgressionGroup[] {
  const groups = new Map<string, ProgressionGroup>()
  for (const session of sessions) {
    if (!isPaced(session)) continue
    const key = `${session.kind}:${session.reps.format}`
    const group = groups.get(key) ?? { key, kind: session.kind, format: session.reps.format, sessions: [] }
    group.sessions.push(session)
    groups.set(key, group)
  }
  // Ordre stable d'une période à l'autre : les options du sélecteur ne
  // changent pas de place quand le nombre de séances varie.
  return [...groups.values()].sort(
    (a, b) => a.kind.localeCompare(b.kind) || REP_FORMATS.indexOf(a.format) - REP_FORMATS.indexOf(b.format),
  )
}

/** Groupe montré par défaut : le plus fourni, le premier à égalité. */
export function defaultProgressionGroup(groups: ProgressionGroup[]): ProgressionGroup | null {
  return groups.reduce<ProgressionGroup | null>(
    (best, group) => (best == null || group.sessions.length > best.sessions.length ? group : best),
    null,
  )
}

/**
 * Écart d'allure de chaque séance avec la précédente de son groupe, en s/km
 * (négatif : plus rapide). Absent pour la première séance d'un groupe.
 */
export function paceDeltas(groups: ProgressionGroup[]): Map<string, number> {
  const deltas = new Map<string, number>()
  for (const { sessions } of groups) {
    for (let i = 1; i < sessions.length; i++) {
      deltas.set(sessions[i].activity.id, sessions[i].reps.paceSecPerKm - sessions[i - 1].reps.paceSecPerKm)
    }
  }
  return deltas
}

export interface GroupTrend {
  latest: PacedSession
  // Moyennes des séances précédentes du groupe, chacune comptant pour une :
  // null quand la dernière séance est aussi la première.
  previousPaceSecPerKm: number | null
  previousHeartRate: number | null
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Dernière séance du groupe, face à la moyenne des précédentes. */
export function groupTrend(group: ProgressionGroup): GroupTrend {
  const latest = group.sessions[group.sessions.length - 1]
  const previous = group.sessions.slice(0, -1)
  const previousHeartRates = previous.map((s) => s.reps.avgHeartRate).filter((hr): hr is number => hr != null)

  return {
    latest,
    previousPaceSecPerKm: previous.length > 0 ? Math.round(mean(previous.map((s) => s.reps.paceSecPerKm))) : null,
    previousHeartRate: previousHeartRates.length > 0 ? Math.round(mean(previousHeartRates)) : null,
  }
}
