import { formatDistance, formatDuration, formatPace } from './utils'
import type { Activity, ActivityLabel, LapIntensity } from './types'

// UploadedActivity = Activity & { trackPointsCount } — un seul formatteur
// suffit pour la réponse d'upload comme pour GET /activities/:id.
export function formatActivity(activity: Activity) {
  const paceSecPerKm =
    activity.totalDistanceM > 0 ? Math.round(activity.totalDurationSec / (activity.totalDistanceM / 1000)) : 0

  return {
    distance: formatDistance(activity.totalDistanceM),
    duration: formatDuration(Math.round(activity.totalDurationSec)),
    pace: paceSecPerKm > 0 ? formatPace(paceSecPerKm) : '—',
  }
}

// Rendu d'un lap selon son intensité, dans le vocabulaire déjà utilisé sur les
// cases du calendrier : pastille + libellé. ACTIVE et INTERVAL disent la même
// chose côté athlète (un effort) — une montre écrit l'un ou l'autre, rarement
// les deux. REST et RECOVERY sont distingués car ils le sont vraiment : arrêt
// complet contre trot de récupération. OTHER et null ne renvoient rien : une
// case vide vaut mieux qu'une étiquette qui n'apprend rien.
export function lapIntensityStyle(intensity: LapIntensity | null): {
  label: string
  dotClass: string
  isRecovery: boolean
} | null {
  switch (intensity) {
    case 'ACTIVE':
    case 'INTERVAL':
      return { label: 'Work', dotClass: 'bg-accent', isRecovery: false }
    case 'RECOVERY':
      return { label: 'Recovery', dotClass: 'bg-neutral-400', isRecovery: true }
    case 'REST':
      return { label: 'Rest', dotClass: 'bg-neutral-400', isRecovery: true }
    case 'WARMUP':
      return { label: 'Warm-up', dotClass: 'bg-accent-300', isRecovery: false }
    case 'COOLDOWN':
      return { label: 'Cool-down', dotClass: 'bg-accent-300', isRecovery: false }
    default:
      return null
  }
}

// Étiquettes d'activité en chips. La course garde l'accent secondaire — c'est
// la seule qui mérite d'attirer l'œil dans une liste ; le reste reste neutre.
export function activityLabelStyle(label: ActivityLabel): { text: string; variant: 'accent-2' | 'neutral' } {
  switch (label) {
    case 'RACE':
      return { text: 'Race', variant: 'accent-2' }
    case 'LONG_RUN':
      return { text: 'Long run', variant: 'neutral' }
    case 'WORKOUT':
      return { text: 'Workout', variant: 'neutral' }
    case 'RECOVERY':
      return { text: 'Recovery', variant: 'neutral' }
  }
}
