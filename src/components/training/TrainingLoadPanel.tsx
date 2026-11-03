import { TrainingLoadChart } from '@/components/charts/TrainingLoadChart'
import { Stat } from '@/components/ui/Stat'
import type { TrainingLoadSeries } from '@/lib/types'

// Lecture usuelle de la fraîcheur (TSB). Les bornes sont des repères, pas des
// seuils physiologiques : au-dessus de +25 on est reposé mais plus forcément
// entraîné, en dessous de -30 on accumule plus vite qu'on n'encaisse.
const FORM_BANDS = [
  { min: 25, label: 'Very fresh', hint: 'Rested — but fitness is starting to slip', tone: 'warning' },
  { min: 5, label: 'Fresh', hint: 'Race-ready territory', tone: 'success' },
  { min: -10, label: 'Neutral', hint: 'Load and recovery are balanced', tone: 'neutral' },
  { min: -30, label: 'Building', hint: 'Productive fatigue — where progress is made', tone: 'success' },
  { min: -Infinity, label: 'Deep fatigue', hint: 'Sustained overload — watch recovery', tone: 'danger' },
] as const

const TONE_CLASS = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-text/60',
} as const

function formBand(tsb: number) {
  return FORM_BANDS.find((band) => tsb >= band.min) ?? FORM_BANDS[FORM_BANDS.length - 1]
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

/**
 * Condition, fatigue et fraîcheur de l'athlète.
 *
 * Tout ce qui est affiché ici est estimé (cf. TrainingLoadSeries) : les
 * mentions sous le graphe ne sont pas de la prudence décorative, ce sont les
 * conditions de lecture des chiffres au-dessus.
 */
export function TrainingLoadPanel({ series }: { series: TrainingLoadSeries }) {
  if (series.activityCount === 0 || series.points.length === 0) {
    return (
      <section className="panel rounded-lg px-6 py-5">
        <h4 className="mb-2">Training load</h4>
        <p className="text-[13px] text-text/50 max-w-[52ch]">
          Fitness, fatigue and form appear once you have imported a few activities — connect Strava
          or upload a .fit file to get started.
        </p>
      </section>
    )
  }

  const { current, sourceCounts, activityCount } = series
  const band = formBand(current.tsb)

  const estimatedFromDuration = sourceCounts.DURATION
  const showProvenance = estimatedFromDuration / activityCount > 0.3

  return (
    <section className="panel rounded-lg px-6 py-5">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
        <h4 className="mb-0">Training load</h4>
        <span className="text-[11px] uppercase tracking-[0.11em] text-text/40">
          Estimated · {activityCount} activities
        </span>
      </div>

      <div className="flex gap-10 flex-wrap mb-6">
        <Stat label="Fitness (CTL)" value={current.ctl.toFixed(1)} />
        <Stat label="Fatigue (ATL)" value={current.atl.toFixed(1)} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.11em] text-text/45">Form (TSB)</div>
          <div className="metric mt-1.5 font-semibold leading-none text-[26px]">
            {signed(current.tsb)}
          </div>
          {/* Le libellé porte l'information, la couleur ne fait que la doubler :
              lue seule, elle ne dirait pas si « rouge » veut dire frais ou cuit. */}
          <div className={`text-[11px] mt-1.5 ${TONE_CLASS[band.tone]}`}>{band.label}</div>
        </div>
        <Stat label="7-day load" value={series.weeklyLoad.toFixed(0)} size="sm" />
        <Stat label="Ramp rate" value={signed(series.rampRate)} size="sm" />
      </div>

      <TrainingLoadChart points={series.points} />

      <p className="text-[12px] text-text/45 mt-4 max-w-[64ch]">
        {band.hint}. Fitness is a 42-day average of your session load, fatigue a 7-day one, and form
        the gap between them.
        {!current.settled &&
          ' Your history is still shorter than 42 days, so fitness is not yet fully built up and reads low.'}
        {showProvenance &&
          ` ${estimatedFromDuration} of ${activityCount} activities have no usable heart-rate trace — their load is estimated from duration alone.`}
      </p>
    </section>
  )
}
