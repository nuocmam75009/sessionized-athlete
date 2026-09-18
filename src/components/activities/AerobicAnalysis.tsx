'use client'

import { useEffect, useState } from 'react'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { formatDuration, formatPace } from '@/lib/utils'
import type { AerobicAnalysis as Analysis, AerobicRejection, DecouplingRating } from '@/lib/types'

// Pourquoi il n'y a rien à calculer. Affiché, et pas tu : un athlète qui ne
// voit jamais l'analyse sur ses séances doit pouvoir comprendre que c'est
// normal, et à quelle condition elle apparaîtra.
const REJECTIONS: Record<AerobicRejection, string> = {
  NO_HEART_RATE: 'no usable heart-rate trace on this activity',
  NO_SPEED: 'no speed data on this activity',
  TOO_SHORT: 'too short — it needs 20 minutes of steady running once the warm-up is cut',
  VARIABLE_EFFORT: 'the effort is not steady — drift only means something on a continuous run',
}

const RATINGS: Record<DecouplingRating, { label: string; tone: string; hint: string }> = {
  GOOD: {
    label: 'Solid',
    tone: 'text-success',
    hint: 'Pace and heart rate held together — your aerobic base carried this effort.',
  },
  MODERATE: {
    label: 'Some drift',
    tone: 'text-warning',
    hint: 'Heart rate climbed relative to pace in the back half — normal on a hard or long day.',
  },
  HIGH: {
    label: 'Heavy drift',
    tone: 'text-danger',
    hint: 'The second half cost noticeably more for the same pace — heat, fatigue, fuelling, or an effort above your current base.',
  },
}

/**
 * Réponse aérobie de la séance : facteur d'efficacité et découplage allure/FC.
 *
 * Chargé à part du détail de séance (GET /activities/:id/analysis) parce que le
 * calcul relit toute la trace seconde par seconde.
 */
export function AerobicAnalysis({ activityId }: { activityId: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/activities/${activityId}/analysis`)
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
      <p className="text-[12px] text-text/40 mb-7">
        No aerobic analysis for this session — {REJECTIONS[analysis.reason]}.
      </p>
    )
  }

  const rating = RATINGS[analysis.rating]
  const halves = [
    { label: 'First half', ...analysis.first },
    { label: 'Second half', ...analysis.second },
  ]

  return (
    <section className="mb-7">
      <h4 className="mb-3">Aerobic response</h4>
      <div className="panel rounded-lg px-6 py-5">
        <div className="flex gap-10 flex-wrap mb-5">
          <Stat label="Efficiency factor" value={analysis.efficiencyFactor.toFixed(2)} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.11em] text-text/45">Decoupling</div>
            <div className="metric mt-1.5 font-semibold leading-none text-[26px]">
              {analysis.decouplingPct > 0 ? '+' : ''}
              {analysis.decouplingPct.toFixed(1)} %
            </div>
            {/* La couleur double le libellé, elle ne le remplace pas. */}
            <div className={`text-[11px] mt-1.5 ${rating.tone}`}>{rating.label}</div>
          </div>
          <Stat
            label="Analysed"
            value={formatDuration(Math.round(analysis.analyzedDurationSec))}
            size="sm"
          />
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thClass}>Split</th>
              <th className={`${thClass} text-right`}>Pace</th>
              <th className={`${thClass} text-right`}>Heart rate</th>
              <th className={`${thClass} text-right`}>EF</th>
            </tr>
          </thead>
          <tbody>
            {halves.map((half) => (
              <tr key={half.label}>
                <td className={`${tdClass} text-text/60`}>{half.label}</td>
                <td className={`${tdClass} metric text-right`}>
                  {formatPace(half.avgPaceSecPerKm)}
                </td>
                <td className={`${tdClass} metric text-right`}>
                  {Math.round(half.avgHeartRate)} bpm
                </td>
                <td className={`${tdClass} metric text-right`}>
                  {half.efficiencyFactor.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[12px] text-text/45 mt-4 max-w-[64ch]">
          {rating.hint} Efficiency factor is metres covered per minute per heartbeat — it rises as
          you get faster at the same heart rate. The first{' '}
          {formatDuration(Math.round(analysis.analyzedFromSec))} are excluded as warm-up.
          {!analysis.terrainReliable &&
            ` This run climbs about ${Math.round(analysis.elevationGainMPerKm ?? 0)} m per km, so raw pace no longer reflects the effort — read the drift with caution until pace is grade-adjusted.`}
        </p>
      </div>
    </section>
  )
}
