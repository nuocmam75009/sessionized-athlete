'use client'

import { useEffect, useState } from 'react'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import { clientFetch } from '@/lib/client-fetch'
import { formatDecimal, formatDuration, formatPace } from '@/lib/utils'
import type { AerobicAnalysis as Analysis, DecouplingRating } from '@/lib/types'

// Couleur de chaque verdict ; libellé et explication : t.aerobic.ratings. Les
// raisons d'une analyse impossible (t.aerobic.rejections) sont affichées, et
// pas tues : un athlète qui ne voit jamais l'analyse sur ses séances doit
// pouvoir comprendre que c'est normal, et à quelle condition elle apparaîtra.
const RATING_TONES: Record<DecouplingRating, string> = {
  GOOD: 'text-success',
  MODERATE: 'text-warning',
  HIGH: 'text-danger',
}

/**
 * Réponse aérobie de la séance : facteur d'efficacité et découplage allure/FC.
 *
 * Chargé à part du détail de séance (GET /activities/:id/analysis) parce que le
 * calcul relit toute la trace seconde par seconde.
 */
export function AerobicAnalysis({ activityId }: { activityId: string }) {
  const { locale, t } = useI18n()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    let cancelled = false

    clientFetch(`/api/activities/${activityId}/analysis`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Analysis | null) => {
        if (!cancelled) setAnalysis(data)
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null)
      })

    return () => {
      cancelled = true
    }
  }, [activityId])

  // Rien tant que la réponse n'est pas là : un squelette qui clignote sur une
  // section secondaire coûte plus qu'il ne rapporte.
  if (!analysis) return null

  if (!analysis.eligible) {
    return (
      <p className="text-[12px] text-text/60 mb-7">{t.aerobic.noAnalysis(t.aerobic.rejections[analysis.reason])}</p>
    )
  }

  const rating = t.aerobic.ratings[analysis.rating]
  const halves = [
    { key: 'first', label: t.aerobic.firstHalf, ...analysis.first },
    { key: 'second', label: t.aerobic.secondHalf, ...analysis.second },
  ]

  return (
    <section className="mb-7">
      <h2 className="section-title mb-3">{t.aerobic.title}</h2>
      <div className="panel rounded-lg px-6 py-5">
        <div className="flex gap-10 flex-wrap mb-5">
          <Stat label={t.aerobic.efficiencyFactor} value={formatDecimal(analysis.efficiencyFactor, 2, locale)} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.11em] text-text/60">{t.aerobic.decoupling}</div>
            <div className="metric mt-1.5 font-semibold leading-none text-[26px]">
              {formatDecimal(analysis.decouplingPct, 1, locale, { signed: true })} %
            </div>
            {/* La couleur double le libellé, elle ne le remplace pas. */}
            <div className={`text-[11px] mt-1.5 ${RATING_TONES[analysis.rating]}`}>{rating.label}</div>
          </div>
          <Stat
            label={t.aerobic.analysed}
            value={formatDuration(Math.round(analysis.analyzedDurationSec))}
            size="sm"
          />
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thClass}>{t.aerobic.split}</th>
              <th className={`${thClass} text-right`}>{t.stats.pace}</th>
              <th className={`${thClass} text-right`}>{t.stats.heartRate}</th>
              <th className={`${thClass} text-right`}>{t.aerobic.ef}</th>
            </tr>
          </thead>
          <tbody>
            {halves.map((half) => (
              <tr key={half.key}>
                <td className={`${tdClass} text-text/60`}>{half.label}</td>
                <td className={`${tdClass} metric text-right`}>{formatPace(half.avgPaceSecPerKm)}</td>
                <td className={`${tdClass} metric text-right`}>{Math.round(half.avgHeartRate)} bpm</td>
                <td className={`${tdClass} metric text-right`}>{formatDecimal(half.efficiencyFactor, 2, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[12px] text-text/60 mt-4 max-w-[64ch]">
          {rating.hint} {t.aerobic.explanation(formatDuration(Math.round(analysis.analyzedFromSec)))}
          {!analysis.terrainReliable && t.aerobic.hillyTerrain(Math.round(analysis.elevationGainMPerKm ?? 0))}
        </p>
      </div>
    </section>
  )
}
