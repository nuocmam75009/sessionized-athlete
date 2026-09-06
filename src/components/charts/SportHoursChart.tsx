'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { sportColor } from '@/lib/sport'
import { formatDistance, formatDuration } from '@/lib/utils'
import type { SportBreakdown } from '@/lib/calendar'

interface SportSlice {
  label: string
  durationSec: number
  activityCount: number
  distanceM: number
  shareLabel: string
  color: string
}

function formatShare(seconds: number, totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 %'
  const share = (seconds / totalSeconds) * 100
  // Un sport effleuré ne doit pas s'afficher "0 %" alors qu'il a du temps.
  return `${share > 0 && share < 1 ? '<1' : Math.round(share)} %`
}

// Répartition du temps du mois par sport. Le total au centre donne l'ensemble
// dont les arcs sont les parts ; les chiffres exacts par sport sont dans le
// tableau qui accompagne le graphe et qui lui sert de légende.
export function SportHoursChart({ bySport }: { bySport: SportBreakdown[] }) {
  const totalSeconds = bySport.reduce((sum, entry) => sum + entry.durationSec, 0)

  const slices: SportSlice[] = bySport.map((entry) => ({
    label: entry.label,
    durationSec: entry.durationSec,
    activityCount: entry.activityCount,
    distanceM: entry.distanceM,
    shareLabel: formatShare(entry.durationSec, totalSeconds),
    color: sportColor(entry.kind),
  }))

  return (
    <div className="relative">
      <PieChart style={{ width: '100%', aspectRatio: 1 }} responsive>
        <Pie
          data={slices}
          dataKey="durationSec"
          nameKey="label"
          innerRadius="66%"
          outerRadius="100%"
          // Rayon fixe et non "50%" comme dans l'exemple Recharts : sur une part
          // de quelques pourcents, un rayon proportionnel dépasse la longueur de
          // l'arc et la dessine en pastille difforme au lieu d'un arc arrondi.
          cornerRadius={4}
          paddingAngle={3}
          stroke="none"
          isAnimationActive={false}
        >
          {slices.map((slice) => (
            <Cell key={slice.label} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip content={<SportTooltip />} />
      </PieChart>

      {/* Le trou du donut porte le total : sans lui, les arcs ne disent que des
          proportions. pointer-events-none pour ne pas manger le survol. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-heading font-semibold text-lg leading-none">
          {formatDuration(Math.round(totalSeconds))}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-text/45 mt-1">total</span>
      </div>
    </div>
  )
}

function SportTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null
  const slice = payload[0].payload as SportSlice

  return (
    <div className="bg-bg border border-divider rounded-md px-3 py-2 shadow-sm">
      <div className="font-heading font-semibold text-xs">{slice.label}</div>
      <div className="text-xs text-text/60 mt-0.5">
        {formatDuration(Math.round(slice.durationSec))} · {slice.shareLabel}
      </div>
      <div className="text-xs text-text/60">
        {slice.activityCount} session{slice.activityCount === 1 ? '' : 's'}
        {slice.distanceM > 0 && ` · ${formatDistance(slice.distanceM)}`}
      </div>
    </div>
  )
}
