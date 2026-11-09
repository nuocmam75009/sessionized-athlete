'use client'

import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MouseHandlerDataParam, TooltipContentProps } from 'recharts'
import {
  formatClock,
  formatPaceTick,
  paceAxis,
  SLOWEST_PACE_SEC_PER_KM,
  timeTicks,
  type LapSpan,
  type PaceSample,
} from '@/lib/pace-chart'
import { formatPace } from '@/lib/utils'

const AXIS_TICK = { fill: 'var(--color-text)', fontSize: 11, opacity: 0.45 }
const HIGHLIGHT = 'var(--color-accent)'
const OVERVIEW_AXIS = 'overview'

interface Range {
  startIndex: number
  endIndex: number
}

// Allure au fil de la séance. Les laps sélectionnés ressortent en couleur
// d'accent, bornés par deux traits verticaux ; le reste de la courbe s'efface.
// Sans sélection, toute la courbe est en accent. Une seule série et un seul
// axe : l'allure, plus rapide en haut, comme la lit un coureur.
export function PaceChart({
  samples,
  spans,
  selectedIds,
  onLapClick,
}: {
  samples: PaceSample[]
  spans: LapSpan[]
  selectedIds: ReadonlySet<string>
  onLapClick?: (lapId: string) => void
}) {
  // Zone affichée, pilotée par la navigation du bas. Remise à zéro quand la
  // trace change : les index ne désignent plus les mêmes points.
  const [range, setRange] = useState<{ samples: PaceSample[]; value: Range } | null>(null)
  const visible = range?.samples === samples ? range.value : { startIndex: 0, endIndex: samples.length - 1 }

  const selectedSpans = useMemo(() => spans.filter((span) => selectedIds.has(span.lapId)), [spans, selectedIds])

  // Fonction plutôt que colonne calculée : les données gardent la même
  // identité quand la sélection change, et la navigation garde sa position.
  const highlighted = useCallback(
    (sample: PaceSample) =>
      selectedSpans.length === 0 || selectedSpans.some((span) => sample.t >= span.start && sample.t <= span.end)
        ? sample.pace
        : null,
    [selectedSpans],
  )

  const shown = samples.slice(visible.startIndex, visible.endIndex + 1)
  const from = shown[0]?.t ?? 0
  const to = shown[shown.length - 1]?.t ?? 0
  const yAxis = paceAxis(shown.map((sample) => sample.pace))
  const xTicks = timeTicks(from, to)

  // Traits aux bornes des laps sélectionnés, sans doublon entre deux laps
  // sélectionnés qui se suivent.
  const boundaries = [...new Set(selectedSpans.flatMap((span) => [span.start, span.end]))]

  const handleClick = (state: MouseHandlerDataParam, event: MouseEvent<SVGGraphicsElement>) => {
    if (!onLapClick || typeof state.activeLabel !== 'number') return
    // Un clic dans l'aperçu du bas sert à naviguer, pas à sélectionner.
    if (event.target instanceof Element && event.target.closest('.recharts-brush')) return
    const t = state.activeLabel
    const span = spans.find((s) => t >= s.start && t < s.end)
    if (span) onLapClick(span.lapId)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={samples}
        margin={{ top: 12, right: 8, bottom: 0, left: -6 }}
        onClick={handleClick}
        style={onLapClick && spans.length > 0 ? { cursor: 'pointer' } : undefined}
      >
        <CartesianGrid stroke="var(--color-text)" strokeOpacity={0.06} vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[from, to]}
          ticks={xTicks}
          tickFormatter={formatClock}
          axisLine={false}
          tickLine={false}
          tick={AXIS_TICK}
          allowDataOverflow
        />
        <YAxis
          reversed
          domain={yAxis.domain}
          ticks={yAxis.ticks}
          tickFormatter={formatPaceTick}
          // Toutes les graduations calculées, y compris celle du bord haut,
          // que Recharts retire sinon faute de place pour son libellé.
          interval={0}
          axisLine={false}
          tickLine={false}
          tick={AXIS_TICK}
          width={48}
          allowDataOverflow
        />
        {selectedSpans.map((span) => (
          <ReferenceArea
            key={span.lapId}
            x1={span.start}
            x2={span.end}
            fill={HIGHLIGHT}
            fillOpacity={0.07}
            strokeOpacity={0}
            ifOverflow="hidden"
          />
        ))}
        {boundaries.map((x) => (
          <ReferenceLine key={x} x={x} stroke={HIGHLIGHT} strokeOpacity={0.75} strokeWidth={1.5} ifOverflow="hidden" />
        ))}
        <Tooltip
          cursor={{ stroke: 'var(--color-text)', strokeOpacity: 0.2 }}
          content={({ active, payload }) => <PaceTooltip active={active} payload={payload} spans={spans} />}
          isAnimationActive={false}
        />
        <Line
          dataKey="pace"
          stroke="var(--color-text)"
          strokeOpacity={0.28}
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey={highlighted}
          name="Pace"
          stroke={HIGHLIGHT}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-bg)' }}
          isAnimationActive={false}
        />
        <Brush
          dataKey="t"
          height={44}
          travellerWidth={8}
          stroke="var(--color-accent)"
          fill="var(--color-surface)"
          tickFormatter={formatClock}
          ariaLabel="Zoom on part of the session"
          onChange={(next) => setRange({ samples, value: next })}
        >
          {/* Axe propre à l'aperçu : il partage le magasin d'état du graphe
              principal, et un second axe d'identifiant 0 en écraserait les
              réglages (graduations affichées dans l'aperçu, bornes perdues). */}
          <LineChart>
            <YAxis yAxisId={OVERVIEW_AXIS} hide reversed domain={['dataMin', 'dataMax']} />
            <Line
              yAxisId={OVERVIEW_AXIS}
              dataKey="pace"
              stroke="var(--color-text)"
              strokeOpacity={0.3}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId={OVERVIEW_AXIS}
              dataKey={highlighted}
              stroke={HIGHLIGHT}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </Brush>
      </LineChart>
    </ResponsiveContainer>
  )
}

function PaceTooltip({
  active,
  payload,
  spans,
}: Partial<Pick<TooltipContentProps<number, string>, 'active' | 'payload'>> & { spans: LapSpan[] }) {
  if (!active || !payload || payload.length === 0) return null
  const sample = payload[0].payload as PaceSample
  const lap = spans.find((span) => sample.t >= span.start && sample.t < span.end)

  return (
    <div className="panel rounded-md px-3 py-2 shadow-lg backdrop-blur-sm">
      <div className="font-heading font-semibold text-xs mb-1.5">
        {formatClock(sample.t)}
        {lap && <span className="font-normal text-text/60"> · Lap {lap.number}</span>}
      </div>
      <div className="metric text-xs">
        {sample.pace == null
          ? '—'
          : sample.pace >= SLOWEST_PACE_SEC_PER_KM
            ? `> ${formatPace(SLOWEST_PACE_SEC_PER_KM)}`
            : formatPace(sample.pace)}
      </div>
    </div>
  )
}
