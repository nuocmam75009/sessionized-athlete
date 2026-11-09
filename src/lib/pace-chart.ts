import type { Lap, TrackPoint } from './types'

// Données du graphe d'allure d'une activité et de la sélection de laps qui
// l'accompagne. Fonctions pures : le composant (PaceChart) ne fait qu'afficher.

// Allure la plus lente affichée, 10'00"/km. À l'arrêt ou en marchant, l'allure
// tend vers l'infini : sans plafond, une récupération à l'arrêt écraserait
// toute la courbe des répétitions contre le haut du graphe.
export const SLOWEST_PACE_SEC_PER_KM = 600
const SLOWEST_SPEED_M_PER_SEC = 1000 / SLOWEST_PACE_SEC_PER_KM

// Environ 800 points suffisent à la largeur d'un écran. Une trace d'une heure
// en compte 3 600 (un par seconde), et Recharts, qui dessine en SVG, ralentit
// nettement au-delà de quelques milliers, surtout pendant qu'on fait glisser
// la zone de navigation.
const DEFAULT_MAX_POINTS = 800
// Fenêtre de lissage : la vitesse instantanée d'une montre oscille de ± 10 %
// d'une seconde à l'autre, ce qui rend la courbe illisible sans la gommer
// assez pour effacer le départ d'une répétition.
const DEFAULT_SMOOTHING_SEC = 5
// Au-delà de cet écart entre deux mesures (pause automatique de la montre),
// la courbe s'interrompt plutôt que de tracer une droite sur le trou.
const GAP_SEC = 30

export interface PaceSample {
  // Secondes depuis le départ, repère de TrackPoint.elapsedSec.
  t: number
  // Allure en s/km, plafonnée à SLOWEST_PACE_SEC_PER_KM ; null sans mesure.
  pace: number | null
}

export interface LapSpan {
  lapId: string
  // Numéro affiché : la position du lap, à partir de 1.
  number: number
  start: number
  end: number
}

export interface LapSpans {
  spans: LapSpan[]
  // true quand chaque lap porte son départ (startElapsedSec). Sinon les
  // départs sont la somme des durées des laps précédents, exacte pour un .fit
  // (durée écoulée) mais décalée à chaque arrêt pour un lap Strava, qui ne
  // compte que le temps en mouvement.
  exact: boolean
}

export interface LapSummary {
  count: number
  distanceM: number
  durationSec: number
  paceSecPerKm: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
}

/** Laps triés dans l'ordre de la séance. L'API ne garantit pas l'ordre. */
export function sortLaps<T extends Pick<Lap, 'index'>>(laps: readonly T[]): T[] {
  return [...laps].sort((a, b) => a.index - b.index)
}

/** Position de chaque lap sur l'axe du temps. `laps` doit être trié. */
export function lapSpans(laps: readonly Lap[]): LapSpans {
  const exact = laps.length > 0 && laps.every((lap) => lap.startElapsedSec != null)

  let cursor = 0
  const starts = laps.map((lap) => {
    const start = exact ? (lap.startElapsedSec ?? cursor) : cursor
    cursor = start + lap.durationSec
    return start
  })

  return {
    exact,
    spans: laps.map((lap, i) => {
      const next = starts[i + 1]
      return {
        lapId: lap.id,
        number: i + 1,
        start: starts[i],
        // Le lap s'arrête où commence le suivant quand les départs sont
        // connus : un arrêt en fin de lap Strava, absent de sa durée, ne
        // reste ainsi hors d'aucun lap.
        end: exact && next != null ? Math.max(starts[i], next) : starts[i] + lap.durationSec,
      }
    }),
  }
}

/**
 * Courbe d'allure : vitesse lissée sur `smoothingSec`, réduite à `maxPoints`
 * par moyenne sur des tranches de temps égales, puis convertie en allure.
 *
 * On moyenne des vitesses, jamais des allures : la moyenne de 3'00" et de
 * 9'00"/km n'est pas 6'00", c'est 4'30".
 */
export function paceSeries(
  points: readonly TrackPoint[],
  { maxPoints = DEFAULT_MAX_POINTS, smoothingSec = DEFAULT_SMOOTHING_SEC } = {},
): PaceSample[] {
  const samples = points
    .filter((p) => Number.isFinite(p.elapsedSec))
    .map((p) => ({ t: p.elapsedSec, v: p.speedMPerSec ?? null, d: p.distanceM ?? null }))
    .sort((a, b) => a.t - b.t)
  if (samples.length < 2) return []

  // Certaines montres n'écrivent que la distance : la vitesse s'en déduit.
  if (samples.every((s) => s.v == null)) {
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]
      const cur = samples[i]
      const dt = cur.t - prev.t
      if (dt > 0 && cur.d != null && prev.d != null) cur.v = Math.max(0, (cur.d - prev.d) / dt)
    }
  }
  if (samples.every((s) => s.v == null)) return []

  const smoothed = smoothSpeeds(samples, smoothingSec)
  const bucketSec = samples.length <= maxPoints ? 0 : (samples[samples.length - 1].t - samples[0].t) / maxPoints
  const reduced = bucketSec > 0 ? bucketAverage(smoothed, maxPoints, bucketSec) : smoothed
  // Deux tranches voisines sont espacées d'une largeur de tranche : seul un
  // écart nettement supérieur trahit une pause.
  const gapSec = Math.max(GAP_SEC, 2 * bucketSec)

  const out: PaceSample[] = []
  reduced.forEach((sample, i) => {
    const prev = reduced[i - 1]
    if (prev && sample.t - prev.t > gapSec) out.push({ t: (prev.t + sample.t) / 2, pace: null })
    out.push({ t: sample.t, pace: speedToPace(sample.v) })
  })
  return out
}

interface SpeedSample {
  t: number
  v: number | null
}

// Moyenne glissante centrée, sur une fenêtre en secondes et non en nombre de
// points : l'échantillonnage n'est pas toujours d'une seconde (Strava espace
// ses points, la pause automatique en supprime).
function smoothSpeeds(samples: readonly SpeedSample[], windowSec: number): SpeedSample[] {
  const half = windowSec / 2
  let lo = 0
  let hi = 0
  let sum = 0
  let count = 0

  return samples.map((sample) => {
    while (hi < samples.length && samples[hi].t <= sample.t + half) {
      const v = samples[hi].v
      if (v != null) {
        sum += v
        count++
      }
      hi++
    }
    while (samples[lo].t < sample.t - half) {
      const v = samples[lo].v
      if (v != null) {
        sum -= v
        count--
      }
      lo++
    }
    return { t: sample.t, v: sample.v == null || count === 0 ? null : sum / count }
  })
}

function bucketAverage(samples: readonly SpeedSample[], buckets: number, width: number): SpeedSample[] {
  const t0 = samples[0].t
  const acc = Array.from({ length: buckets }, () => ({ t: 0, n: 0, v: 0, nv: 0 }))

  for (const sample of samples) {
    const bucket = acc[Math.min(buckets - 1, Math.floor((sample.t - t0) / width))]
    bucket.t += sample.t
    bucket.n++
    if (sample.v != null) {
      bucket.v += sample.v
      bucket.nv++
    }
  }

  return acc
    .filter((bucket) => bucket.n > 0)
    .map((bucket) => ({ t: bucket.t / bucket.n, v: bucket.nv > 0 ? bucket.v / bucket.nv : null }))
}

function speedToPace(v: number | null): number | null {
  if (v == null) return null
  if (v <= SLOWEST_SPEED_M_PER_SEC) return SLOWEST_PACE_SEC_PER_KM
  return Math.round((1000 / v) * 10) / 10
}

/** Totaux des laps sélectionnés, comme la ligne de synthèse d'une montre. */
export function summarizeLaps(laps: readonly Lap[]): LapSummary {
  const distanceM = laps.reduce((sum, lap) => sum + lap.distanceM, 0)
  const durationSec = laps.reduce((sum, lap) => sum + lap.durationSec, 0)

  // FC moyenne pondérée par la durée : un lap de 4 min pèse plus qu'un de 30 s.
  let hrWeighted = 0
  let hrDuration = 0
  for (const lap of laps) {
    if (lap.avgHeartRate != null && lap.durationSec > 0) {
      hrWeighted += lap.avgHeartRate * lap.durationSec
      hrDuration += lap.durationSec
    }
  }
  const maxima = laps.flatMap((lap) => (lap.maxHeartRate != null ? [lap.maxHeartRate] : []))

  return {
    count: laps.length,
    distanceM,
    durationSec,
    paceSecPerKm: distanceM > 0 ? durationSec / (distanceM / 1000) : null,
    avgHeartRate: hrDuration > 0 ? Math.round(hrWeighted / hrDuration) : null,
    maxHeartRate: maxima.length > 0 ? Math.max(...maxima) : null,
  }
}

export function isWorkLap(lap: Pick<Lap, 'intensity'>): boolean {
  return lap.intensity === 'ACTIVE' || lap.intensity === 'INTERVAL'
}

function isRecoveryLap(lap: Pick<Lap, 'intensity'>): boolean {
  return lap.intensity === 'RECOVERY' || lap.intensity === 'REST'
}

/**
 * Laps d'effort d'un fractionné, ou aucun si la séance n'en est pas un. Une
 * montre Garmin marque ACTIVE chaque lap d'une sortie régulière : sans
 * récupération entre eux, ce ne sont pas des répétitions à comparer.
 */
export function workLapIds(laps: readonly Lap[]): string[] {
  if (!laps.some(isRecoveryLap)) return []
  return laps.filter(isWorkLap).map((lap) => lap.id)
}

// "0:00", "5:00", "1:05:00" — l'axe du temps d'une séance.
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mmss = `${h > 0 ? String(m).padStart(2, '0') : m}:${String(s % 60).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

// "4'46"" : allure sans unité, pour les graduations de l'axe.
export function formatPaceTick(secPerKm: number): string {
  const rounded = Math.round(secPerKm)
  return `${Math.floor(rounded / 60)}'${String(rounded % 60).padStart(2, '0')}"`
}

const TIME_STEPS_SEC = [15, 30, 60, 120, 300, 600, 900, 1200, 1800, 3600, 7200]
const PACE_STEPS_SEC = [5, 10, 15, 30, 60, 120]

// Graduations rondes (minutes pleines, puis 5, 10 min…) : celles que choisit
// Recharts sur des secondes tombent sur 8:20 ou 16:40.
export function timeTicks(from: number, to: number, maxTicks = 6): number[] {
  return roundTicks(from, to, TIME_STEPS_SEC, maxTicks)
}

/** Bornes et graduations de l'axe des allures, arrondies à un pas rond. */
export function paceAxis(paces: readonly (number | null)[], maxTicks = 5): { domain: [number, number]; ticks: number[] } {
  const values = paces.filter((p): p is number => p != null)
  if (values.length === 0) return { domain: [0, SLOWEST_PACE_SEC_PER_KM], ticks: [] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = PACE_STEPS_SEC.find((s) => (max - min) / s <= maxTicks - 1) ?? PACE_STEPS_SEC[PACE_STEPS_SEC.length - 1]
  const lo = Math.floor(min / step) * step
  // Au moins un pas d'écart : une allure parfaitement régulière donnerait
  // sinon un axe de hauteur nulle.
  const hi = Math.max(Math.ceil(max / step) * step, lo + step)
  return { domain: [lo, hi], ticks: roundTicks(lo, hi, [step], Number.POSITIVE_INFINITY) }
}

function roundTicks(from: number, to: number, steps: readonly number[], maxTicks: number): number[] {
  const span = Math.max(0, to - from)
  const step = steps.find((s) => span / s <= maxTicks) ?? steps[steps.length - 1]
  const ticks: number[] = []
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push(t)
  return ticks
}
