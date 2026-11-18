'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { useI18n } from '@/hooks/useI18n'
import { intlLocale } from '@/lib/i18n/config'
import { formatPaceTick, paceAxis } from '@/lib/pace-chart'
import { formatPace, formatShortDate } from '@/lib/utils'

export interface TrainingPacePoint {
  id: string
  // Départ de la séance en millisecondes : l'axe des x est un vrai axe de
  // temps, deux séances à trois semaines d'écart ne sont pas voisines.
  time: number
  startedAt: string
  pace: number
  heartRate: number | null
  title: string
  reps: string
}

const AXIS_TICK = { fill: 'var(--color-text)', fontSize: 11, opacity: 0.45 }

// Allure des répétitions d'un groupe de séances comparables (même sport, même
// format), une série seule : pas de légende, le titre de la section la nomme.
// La FC reste dans l'infobulle et le tableau plutôt que sur un second axe, qui
// ferait croire à une corrélation tenant au seul calage des deux échelles.
export function TrainingPaceChart({ points }: { points: TrainingPacePoint[] }) {
  const { locale } = useI18n()
  const { domain, ticks } = paceAxis(points.map((p) => p.pace))
  const dayFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' })

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
        <CartesianGrid stroke="var(--color-text)" strokeOpacity={0.06} vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          // Une graduation par séance, éclaircie si elles se chevauchent.
          ticks={points.map((p) => p.time)}
          interval="preserveStartEnd"
          minTickGap={36}
          tickFormatter={(time: number) => dayFormat.format(new Date(time))}
          padding={{ left: 16, right: 16 }}
          axisLine={false}
          tickLine={false}
          tick={AXIS_TICK}
        />
        {/* Axe inversé : plus rapide vers le haut, une progression monte. */}
        <YAxis
          reversed
          domain={domain}
          ticks={ticks}
          // Toutes les graduations : par défaut Recharts saute la première,
          // et la meilleure allure flotterait au-dessus du dernier repère.
          interval={0}
          tickFormatter={formatPaceTick}
          axisLine={false}
          tickLine={false}
          tick={AXIS_TICK}
          width={52}
        />
        <Tooltip cursor={{ stroke: 'var(--color-text)', strokeOpacity: 0.2 }} content={<PaceTooltip />} />
        <Line
          // Segments droits : entre deux séances il n'y a pas de mesure, une
          // courbe lissée inventerait un creux ou une bosse.
          type="linear"
          dataKey="pace"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function PaceTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  const { locale, t } = useI18n()
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as TrainingPacePoint

  return (
    <div className="panel rounded-md px-3 py-2 shadow-lg backdrop-blur-sm">
      <div className="font-heading font-semibold text-xs">{point.title}</div>
      <div className="text-[11px] text-text/60 mb-1.5">{formatShortDate(point.startedAt, locale)}</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-xs">
        <dt className="text-text/60">{t.trainingAnalysis.reps}</dt>
        <dd className="metric text-right">{point.reps}</dd>
        <dt className="text-text/60">{t.trainingAnalysis.repPace}</dt>
        <dd className="metric text-right">{formatPace(point.pace)}</dd>
        <dt className="text-text/60">{t.trainingAnalysis.repHr}</dt>
        <dd className="metric text-right">{point.heartRate != null ? `${point.heartRate} bpm` : '—'}</dd>
      </dl>
    </div>
  )
}
