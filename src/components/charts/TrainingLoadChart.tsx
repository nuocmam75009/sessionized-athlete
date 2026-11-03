'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { TrainingLoadPoint } from '@/lib/types'

// Un seul axe : condition, fatigue et fraîcheur sont toutes les trois en TSS,
// la fraîcheur étant la différence des deux autres. Les superposer sur deux
// échelles — ce que font beaucoup d'outils d'entraînement — laisserait croire
// à des croisements qui n'existent pas.
const SERIES = [
  { key: 'ctl', label: 'Fitness', color: 'var(--color-load-fitness)' },
  { key: 'atl', label: 'Fatigue', color: 'var(--color-load-fatigue)' },
  { key: 'tsb', label: 'Form', color: 'var(--color-load-form)' },
] as const

const AXIS_TICK = { fill: 'var(--color-text)', fontSize: 11, opacity: 0.45 }

function formatDayTick(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function TrainingLoadChart({ points }: { points: TrainingLoadPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-text)" strokeOpacity={0.06} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDayTick}
          axisLine={false}
          tickLine={false}
          tick={AXIS_TICK}
          minTickGap={44}
        />
        <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={48} />
        {/* Le zéro n'est un repère que pour la fraîcheur — au-dessus l'athlète
            est frais, en dessous il est en dette. */}
        <ReferenceLine y={0} stroke="var(--color-text)" strokeOpacity={0.22} />
        <Tooltip
          cursor={{ stroke: 'var(--color-text)', strokeOpacity: 0.2 }}
          content={<LoadTooltip />}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="plainline"
          iconSize={14}
          formatter={(value) => (
            <span className="text-[11px] text-text/60 align-middle">{value}</span>
          )}
        />
        {SERIES.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={series.color}
            strokeWidth={2}
            dot={false}
            // Le survol pose un point de 8px sur la courbe : plus petit, il
            // devient impossible à viser sur une série de 90 jours.
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-bg)' }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function LoadTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as TrainingLoadPoint

  return (
    <div className="panel rounded-md px-3 py-2 shadow-lg backdrop-blur-sm">
      <div className="font-heading font-semibold text-xs mb-1.5">{formatDayLabel(point.date)}</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-xs">
        {SERIES.map((series) => (
          <div key={series.key} className="contents">
            <dt className="flex items-center gap-1.5 text-text/60">
              <span
                aria-hidden
                className="inline-block w-2.5 h-0.5 rounded-full"
                style={{ background: series.color }}
              />
              {series.label}
            </dt>
            <dd className="metric text-right">{point[series.key].toFixed(1)}</dd>
          </div>
        ))}
        {point.load > 0 && (
          <div className="contents">
            <dt className="text-text/45 pt-1 border-t border-divider">Session load</dt>
            <dd className="metric text-right text-text/45 pt-1 border-t border-divider">
              {point.load.toFixed(0)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
