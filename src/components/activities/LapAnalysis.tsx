'use client'

import { useMemo, useState } from 'react'
import { PaceChart } from '@/components/charts/PaceChart'
import { Button } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'
import { thClass, tdClass } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import { lapIntensityStyle } from '@/lib/activity-format'
import { lapSpans, paceSeries, sortLaps, summarizeLaps, workLapIds } from '@/lib/pace-chart'
import { formatDistance, formatDuration, formatPace } from '@/lib/utils'
import type { Lap, TrackPoint } from '@/lib/types'

// Graphe d'allure et tableau des laps, reliés par une même sélection : cocher
// un lap (ou cliquer sur sa portion du graphe) le fait ressortir sur la courbe
// et l'ajoute à la synthèse. Le tableau est aussi l'équivalent textuel du
// graphe, et le seul moyen de sélectionner au clavier.
//
// L'appelant remonte le composant quand les laps sont remplacés (.fit rattaché
// après coup) : la sélection désignerait des laps qui n'existent plus.
export function LapAnalysis({
  laps: unsortedLaps,
  trackPoints,
  lapTimesExcludePauses,
}: {
  laps: Lap[]
  trackPoints: TrackPoint[] | null
  // Laps Strava sans .fit : leur durée ne compte que le temps en mouvement.
  lapTimesExcludePauses: boolean
}) {
  const { locale, t } = useI18n()
  const laps = useMemo(() => sortLaps(unsortedLaps), [unsortedLaps])
  const { spans, exact } = useMemo(() => lapSpans(laps), [laps])
  const samples = useMemo(() => (trackPoints ? paceSeries(trackPoints) : []), [trackPoints])
  const workIds = useMemo(() => workLapIds(laps), [laps])

  // Un fractionné s'ouvre sur ses répétitions sélectionnées : c'est elles que
  // l'athlète vient comparer.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set(workIds))

  const toggle = (lapId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(lapId)) next.delete(lapId)
      else next.add(lapId)
      return next
    })

  const selectedLaps = laps.filter((lap) => selectedIds.has(lap.id))
  const summary = selectedLaps.length > 0 ? summarizeLaps(selectedLaps) : null
  const allWorkSelected = workIds.length > 0 && workIds.length === selectedIds.size && workIds.every((id) => selectedIds.has(id))
  // Colonne affichée seulement si au moins un lap porte une intensité — sur une
  // activité Strava sans .fit rattaché, elle serait vide de bout en bout.
  const showIntensity = laps.some((lap) => lapIntensityStyle(lap.intensity) != null)

  return (
    <>
      {samples.length > 0 && (
        <>
          <h2 className="section-title mb-3">{t.laps.paceTitle}</h2>
          <figure className="mb-7">
            <PaceChart samples={samples} spans={spans} selectedIds={selectedIds} onLapClick={toggle} />
            <figcaption className="mt-2 text-xs text-text/60">
              {laps.length > 0 ? t.laps.captionWithLaps : t.laps.captionNoLaps}
              {!exact && lapTimesExcludePauses && laps.length > 0 && t.laps.estimatedPositions}
            </figcaption>
          </figure>
        </>
      )}

      {laps.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="section-title mb-0">{t.laps.title}</h2>
            <div className="flex gap-1">
              {workIds.length > 0 && !allWorkSelected && (
                <Button variant="ghost" onClick={() => setSelectedIds(new Set(workIds))}>
                  {t.laps.selectWork}
                </Button>
              )}
              {selectedIds.size > 0 && (
                <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  {t.laps.clearSelection}
                </Button>
              )}
            </div>
          </div>

          {/* Toujours rendue : une région live ajoutée au DOM avec son contenu
              n'est pas annoncée par les lecteurs d'écran. */}
          <div aria-live="polite" className="panel rounded-lg mb-4 px-5 py-4">
            {summary ? (
              <div className="flex gap-x-8 gap-y-3 flex-wrap items-end">
                <div className="text-xs text-text/60 self-center">
                  {t.laps.selectedCount(summary.count)}
                </div>
                <Stat size="sm" label={t.stats.distance} value={formatDistance(summary.distanceM, locale)} />
                <Stat size="sm" label={t.stats.duration} value={formatDuration(Math.round(summary.durationSec))} />
                <Stat
                  size="sm"
                  label={t.stats.avgPace}
                  value={summary.paceSecPerKm != null ? formatPace(summary.paceSecPerKm) : '—'}
                />
                <Stat
                  size="sm"
                  label={t.stats.avgHr}
                  value={summary.avgHeartRate != null ? `${summary.avgHeartRate}bpm` : '—'}
                />
                <Stat
                  size="sm"
                  label={t.stats.maxHr}
                  value={summary.maxHeartRate != null ? `${summary.maxHeartRate}bpm` : '—'}
                />
              </div>
            ) : (
              <p className="text-xs text-text/60 m-0">{t.laps.selectHint}</p>
            )}
          </div>

          {/* Huit colonnes ne tiennent pas sur un téléphone : le tableau garde
              une largeur lisible et défile dans son conteneur, la page non. */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${thClass} w-8`}>
                    <span className="sr-only">{t.laps.selectedColumn}</span>
                  </th>
                  <th className={thClass}>{t.laps.lap}</th>
                  {showIntensity && <th className={thClass}>{t.laps.type}</th>}
                  <th className={thClass}>{t.stats.distance}</th>
                  <th className={thClass}>{t.stats.duration}</th>
                  <th className={thClass}>{t.stats.pace}</th>
                  <th className={thClass}>{t.stats.avgHr}</th>
                  <th className={thClass}>{t.stats.maxHr}</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap, position) => {
                  const number = position + 1
                  const intensity = lapIntensityStyle(lap.intensity)
                  const selected = selectedIds.has(lap.id)
                  return (
                    <tr
                      key={lap.id}
                      // Toute la ligne est cliquable à la souris ; la case
                      // reste la cible du clavier et des lecteurs d'écran.
                      onClick={() => toggle(lap.id)}
                      className={`cursor-pointer transition-colors ${
                        selected ? 'bg-accent/12' : intensity?.isRecovery ? 'bg-text/4.5' : ''
                      } hover:bg-accent/8`}
                    >
                      <td className={tdClass}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggle(lap.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={t.laps.selectLap(number)}
                          className="accent-accent w-4 h-4 cursor-pointer align-middle"
                        />
                      </td>
                      <td className={`${tdClass} metric font-semibold`}>{number}</td>
                      {showIntensity && (
                        <td className={tdClass}>
                          {intensity && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${intensity.dotClass}`} />
                              <span className="text-[9px] uppercase tracking-widest text-text/60">
                                {t.laps.intensity[intensity.kind]}
                              </span>
                            </span>
                          )}
                        </td>
                      )}
                      <td className={`${tdClass} metric`}>{formatDistance(lap.distanceM, locale)}</td>
                      <td className={`${tdClass} metric`}>{formatDuration(Math.round(lap.durationSec))}</td>
                      <td className={`${tdClass} metric text-text/60`}>
                        {/* Pas d'allure sur une récupération : trente mètres en
                            deux minutes donnent 1h/km, un chiffre qui n'apprend
                            rien et rend la colonne illisible. */}
                        {intensity?.isRecovery || lap.avgPaceSecPerKm == null ? '—' : formatPace(lap.avgPaceSecPerKm)}
                      </td>
                      <td className={`${tdClass} metric text-text/60`}>
                        {lap.avgHeartRate != null ? `${lap.avgHeartRate}bpm` : '—'}
                      </td>
                      <td className={`${tdClass} metric text-text/60`}>
                        {lap.maxHeartRate != null ? `${lap.maxHeartRate}bpm` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
