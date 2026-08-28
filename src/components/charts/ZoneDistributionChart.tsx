'use client'

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatDuration } from '@/lib/utils'
import type { ZoneBucket } from '@/lib/types'

// Rampe d'intensité définie dans globals.css. Un athlète peut avoir plus de
// zones que la rampe (Strava en autorise un nombre variable) : au-delà, les
// zones hautes partagent la dernière couleur.
const ZONE_COLORS = [
  'var(--color-zone-1)',
  'var(--color-zone-2)',
  'var(--color-zone-3)',
  'var(--color-zone-4)',
  'var(--color-zone-5)',
]

const ROW_HEIGHT_PX = 34

interface ZoneRow {
  label: string
  seconds: number
  range: string
  shareLabel: string
  // Précalculé plutôt que rendu via un composant de label custom : LabelList
  // sait afficher directement un champ texte de la donnée.
  valueLabel: string
  color: string
}

function formatShare(seconds: number, totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 %'
  const share = (seconds / totalSeconds) * 100
  // Une zone effleurée ne doit pas s'afficher "0 %" alors qu'elle a du temps.
  return `${share > 0 && share < 1 ? '<1' : Math.round(share)} %`
}

// Graphe générique de répartition du temps par zone : ne connaît ni la FC ni
// l'allure, seulement des tranches et un formateur d'intervalle. Alimenté par
// GET /activities/hr-zones aujourd'hui, /activities/pace-zones ensuite.
export function ZoneDistributionChart({
  zones,
  totalSeconds,
  formatRange,
}: {
  zones: ZoneBucket[]
  totalSeconds: number
  formatRange: (min: number, max: number | null) => string
}) {
  // Zone la plus intense en haut, comme dans les outils d'entraînement usuels.
  const rows: ZoneRow[] = [...zones].reverse().map((zone) => {
    const shareLabel = formatShare(zone.seconds, totalSeconds)
    return {
      label: zone.label,
      seconds: zone.seconds,
      range: formatRange(zone.min, zone.max),
      shareLabel,
      valueLabel: zone.seconds > 0 ? `${formatDuration(zone.seconds)} · ${shareLabel}` : '',
      color: ZONE_COLORS[Math.min(zone.index - 1, ZONE_COLORS.length - 1)],
    }
  })

  return (
    <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT_PX + 8}>
      <BarChart accessibilityLayer layout="vertical" data={rows} margin={{ top: 0, right: 104, bottom: 0, left: 0 }}>
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={26}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--color-text)', fontSize: 11, opacity: 0.6 }}
        />
        <Tooltip cursor={{ fill: 'var(--color-text)', fillOpacity: 0.04 }} content={<ZoneTooltip />} />
        <Bar dataKey="seconds" radius={2} barSize={18} isAnimationActive={false}>
          {rows.map((row) => (
            <Cell key={row.label} fill={row.color} />
          ))}
          <LabelList dataKey="valueLabel" position="right" fill="var(--color-text)" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ZoneTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as ZoneRow

  return (
    <div className="bg-bg border border-divider rounded-md px-3 py-2 shadow-sm">
      <div className="font-heading font-semibold text-xs">
        {row.label} · {row.range}
      </div>
      <div className="text-xs text-text/60 mt-0.5">
        {formatDuration(row.seconds)} · {row.shareLabel}
      </div>
    </div>
  )
}
