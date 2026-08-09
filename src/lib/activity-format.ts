import { formatDistance, formatDuration, formatPace } from './utils'
import type { UploadedActivity } from './types'

export function formatUploadedActivity(activity: UploadedActivity) {
  const paceSecPerKm =
    activity.totalDistanceM > 0 ? Math.round(activity.totalDurationSec / (activity.totalDistanceM / 1000)) : 0

  return {
    distance: formatDistance(activity.totalDistanceM),
    duration: formatDuration(Math.round(activity.totalDurationSec)),
    pace: paceSecPerKm > 0 ? formatPace(paceSecPerKm) : '—',
  }
}
