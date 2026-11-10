'use client'

import { SportIcon } from '@/components/ui/SportIcon'
import { tdClass, thClass } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import { sportColor } from '@/lib/sport'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { SportBreakdown } from '@/lib/calendar'

// Répartition par sport, partagée par le récapitulatif de semaine et celui du
// mois. La pastille colorée reprend la couleur du sport dans le graphe des
// heures — c'est ce qui tient lieu de légende.
export function SportBreakdownTable({ bySport }: { bySport: SportBreakdown[] }) {
  const { locale, t } = useI18n()
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className={thClass}>{t.sportBreakdown.sport}</th>
          <th className={thClass}>{t.sportBreakdown.sessions}</th>
          <th className={thClass}>{t.stats.distance}</th>
          <th className={thClass}>{t.stats.time}</th>
        </tr>
      </thead>
      <tbody>
        {bySport.map((entry) => (
          <tr key={entry.kind}>
            <td className={tdClass}>
              <span className="flex items-center gap-2">
                <SportIcon kind={entry.kind} className="shrink-0" style={{ color: sportColor(entry.kind) }} />
                {t.sports[entry.kind]}
              </span>
            </td>
            <td className={`${tdClass} metric text-text/60`}>{entry.activityCount}</td>
            <td className={`${tdClass} metric`}>
              {entry.distanceM > 0 ? formatDistance(entry.distanceM, locale) : '—'}
            </td>
            <td className={`${tdClass} metric`}>{formatDuration(Math.round(entry.durationSec))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
