import { formatDistance, formatDuration, formatPace } from './utils'
import type { Activity } from './types'

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
