import { SportIcon } from '@/components/ui/SportIcon'
import { tdClass, thClass } from '@/components/ui/table'
import { sportColor } from '@/lib/sport'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { SportBreakdown } from '@/lib/calendar'

// Répartition par sport, partagée par le récapitulatif de semaine et celui du
// mois. La pastille colorée reprend la couleur du sport dans le graphe des
// heures — c'est ce qui tient lieu de légende.
export function SportBreakdownTable({ bySport }: { bySport: SportBreakdown[] }) {
  return (
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
        {bySport.map((entry) => (
          <tr key={entry.kind}>
            <td className={tdClass}>
              <span className="flex items-center gap-2">
                <SportIcon kind={entry.kind} className="shrink-0" style={{ color: sportColor(entry.kind) }} />
                {entry.label}
              </span>
            </td>
            <td className={`${tdClass} metric text-text/50`}>{entry.activityCount}</td>
            <td className={`${tdClass} metric`}>{entry.distanceM > 0 ? formatDistance(entry.distanceM) : "—"}</td>
            <td className={`${tdClass} metric`}>{formatDuration(Math.round(entry.durationSec))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
