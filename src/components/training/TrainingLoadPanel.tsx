import { TrainingLoadChart } from '@/components/charts/TrainingLoadChart'
import { Stat } from '@/components/ui/Stat'
import { getI18n } from '@/lib/i18n/server'
import type { Locale } from '@/lib/i18n/config'
import type { TrainingLoadSeries } from '@/lib/types'
import { formatDecimal } from '@/lib/utils'

// Lecture usuelle de la fraîcheur (TSB). Les bornes sont des repères, pas des
// seuils physiologiques : au-dessus de +25 on est reposé mais plus forcément
// entraîné, en dessous de -30 on accumule plus vite qu'on n'encaisse. Libellés
// et explications : t.trainingLoad.bands.
const FORM_BANDS = [
  { min: 25, key: 'veryFresh', tone: 'warning' },
  { min: 5, key: 'fresh', tone: 'success' },
  { min: -10, key: 'neutral', tone: 'neutral' },
  { min: -30, key: 'building', tone: 'success' },
  { min: -Infinity, key: 'deepFatigue', tone: 'danger' },
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

function signed(value: number, locale: Locale): string {
  return formatDecimal(value, 1, locale, { signed: true })
}

/**
 * Condition, fatigue et fraîcheur de l'athlète.
 *
 * Tout ce qui est affiché ici est estimé (cf. TrainingLoadSeries) : les
 * mentions sous le graphe ne sont pas de la prudence décorative, ce sont les
 * conditions de lecture des chiffres au-dessus.
 */
export async function TrainingLoadPanel({ series }: { series: TrainingLoadSeries }) {
  const { locale, t } = await getI18n()

  if (series.activityCount === 0 || series.points.length === 0) {
    return (
      <section className="panel rounded-lg px-6 py-5">
        <h2 className="section-title mb-2">{t.trainingLoad.title}</h2>
        <p className="text-[13px] text-text/60 max-w-[52ch]">{t.trainingLoad.empty}</p>
      </section>
    )
  }

  const { current, sourceCounts, activityCount } = series
  const band = formBand(current.tsb)
  const bandText = t.trainingLoad.bands[band.key]

  const estimatedFromDuration = sourceCounts.DURATION
  const showProvenance = estimatedFromDuration / activityCount > 0.3

  return (
    <section className="panel rounded-lg px-6 py-5">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
        <h2 className="section-title mb-0">{t.trainingLoad.title}</h2>
        <span className="text-[11px] uppercase tracking-[0.11em] text-text/60">
          {t.trainingLoad.estimated(activityCount)}
        </span>
      </div>

      <div className="flex gap-10 flex-wrap mb-6">
        <Stat label={t.trainingLoad.fitness} value={formatDecimal(current.ctl, 1, locale)} />
        <Stat label={t.trainingLoad.fatigue} value={formatDecimal(current.atl, 1, locale)} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.11em] text-text/60">{t.trainingLoad.form}</div>
          <div className="metric mt-1.5 font-semibold leading-none text-[26px]">{signed(current.tsb, locale)}</div>
          {/* Le libellé porte l'information, la couleur ne fait que la doubler :
              lue seule, elle ne dirait pas si « rouge » veut dire frais ou cuit. */}
          <div className={`text-[11px] mt-1.5 ${TONE_CLASS[band.tone]}`}>{bandText.label}</div>
        </div>
        <Stat label={t.trainingLoad.weeklyLoad} value={formatDecimal(series.weeklyLoad, 0, locale)} size="sm" />
        <Stat label={t.trainingLoad.rampRate} value={signed(series.rampRate, locale)} size="sm" />
      </div>

      <TrainingLoadChart points={series.points} />

      <p className="text-[12px] text-text/60 mt-4 max-w-[64ch]">
        {t.trainingLoad.explanation(bandText.hint)}
        {!current.settled && t.trainingLoad.notSettled}
        {showProvenance && t.trainingLoad.provenance(estimatedFromDuration, activityCount)}
      </p>
    </section>
  )
}
