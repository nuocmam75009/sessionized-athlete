import type { Locale } from './i18n/config'
import { formatDistance, formatDuration, formatPace } from './utils'
import type { Activity, ActivityLabel, LapIntensity } from './types'

// UploadedActivity = Activity & { trackPointsCount } — un seul formatteur
// suffit pour la réponse d'upload comme pour GET /activities/:id.
export function formatActivity(activity: Activity, locale: Locale) {
  const paceSecPerKm =
    activity.totalDistanceM > 0 ? Math.round(activity.totalDurationSec / (activity.totalDistanceM / 1000)) : 0

  return {
    distance: formatDistance(activity.totalDistanceM, locale),
    duration: formatDuration(Math.round(activity.totalDurationSec)),
    pace: paceSecPerKm > 0 ? formatPace(paceSecPerKm) : '—',
  }
}

// Clé du libellé d'intensité dans le dictionnaire (t.laps.intensity).
export type LapIntensityKind = 'work' | 'recovery' | 'rest' | 'warmup' | 'cooldown'

// Rendu d'un lap selon son intensité, dans le vocabulaire déjà utilisé sur les
// cases du calendrier : pastille + libellé. ACTIVE et INTERVAL disent la même
// chose côté athlète (un effort) — une montre écrit l'un ou l'autre, rarement
// les deux. REST et RECOVERY sont distingués car ils le sont vraiment : arrêt
// complet contre trot de récupération. OTHER et null ne renvoient rien : une
// case vide vaut mieux qu'une étiquette qui n'apprend rien.
export function lapIntensityStyle(intensity: LapIntensity | null): {
  kind: LapIntensityKind
  dotClass: string
  isRecovery: boolean
} | null {
  switch (intensity) {
    case 'ACTIVE':
    case 'INTERVAL':
      return { kind: 'work', dotClass: 'bg-accent shadow-[0_0_8px_0_var(--color-accent)]', isRecovery: false }
    case 'RECOVERY':
      return { kind: 'recovery', dotClass: 'bg-neutral-500', isRecovery: true }
    case 'REST':
      return { kind: 'rest', dotClass: 'bg-neutral-500', isRecovery: true }
    case 'WARMUP':
      return { kind: 'warmup', dotClass: 'bg-accent-400', isRecovery: false }
    case 'COOLDOWN':
      return { kind: 'cooldown', dotClass: 'bg-accent-400', isRecovery: false }
    default:
      return null
  }
}

// Variante des étiquettes d'activité en chips (leur texte : t.activity.labels).
// La course garde l'accent secondaire — c'est la seule qui mérite d'attirer
// l'œil dans une liste ; le reste reste neutre.
export function activityLabelVariant(label: ActivityLabel): 'accent-2' | 'neutral' {
  return label === 'RACE' ? 'accent-2' : 'neutral'
}
