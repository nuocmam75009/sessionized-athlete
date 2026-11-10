'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'
import { useZoneDistribution } from '@/hooks/useZoneDistribution'
import { toIsoDateTimeWithOffset, type WeekEntry } from '@/lib/calendar'
import { formatDuration } from '@/lib/utils'

// Recharts pèse une centaine de ko : chargé à la demande pour ne pas retarder
// le premier rendu du calendrier. Le placeholder est calibré sur un modèle à
// 5 zones, le cas courant côté Strava.
const ZoneDistributionChart = dynamic(
  () => import('@/components/charts/ZoneDistributionChart').then((m) => m.ZoneDistributionChart),
  { ssr: false, loading: () => <div className="h-[178px]" /> },
)

function formatHeartRateRange(min: number, max: number | null): string {
  return max != null ? `${min}–${max} bpm` : `${min}+ bpm`
}

// Temps passé par zone de FC sur la semaine sélectionnée. Les bornes envoyées
// à l'API sont des datetimes locaux complets : la semaine est un lundi→dimanche
// local, pas une fenêtre UTC.
export function WeekHeartRateZones({ week }: { week: WeekEntry }) {
  const { t } = useI18n()
  const state = useZoneDistribution(
    toIsoDateTimeWithOffset(week.startDateParam, 'start'),
    toIsoDateTimeWithOffset(week.endDateParam, 'end'),
  )

  if (state.status === 'loading') {
    return <p className="text-sm text-text/60">{t.heartRateZones.loading}</p>
  }

  if (state.status === 'error') {
    return (
      <p className="text-sm text-text/60">
        {state.httpStatus != null
          ? t.heartRateZones.loadFailed(state.httpStatus)
          : t.heartRateZones.loadFailedGeneric}
      </p>
    )
  }

  const { zones, totalSeconds, secondsWithoutData } = state.data

  if (zones.length === 0) {
    return (
      <p className="text-sm text-text/60">
        {t.heartRateZones.notSyncedBefore}{' '}
        <Link href="/athlete-data" className="text-accent underline underline-offset-2 hover:text-accent-700">
          {t.heartRateZones.notSyncedLink}
        </Link>{' '}
        {t.heartRateZones.notSyncedAfter}
      </p>
    )
  }

  if (totalSeconds === 0) {
    return <p className="text-sm text-text/60">{t.heartRateZones.noHeartRate}</p>
  }

  // Part du temps en endurance (Z1–Z2) : le premier chiffre qu'on regarde pour
  // vérifier qu'une semaine est bien polarisée. Sans au moins trois zones, le
  // découpage easy/hard n'a pas de sens.
  const easySeconds = zones.filter((z) => z.index <= 2).reduce((sum, z) => sum + z.seconds, 0)
  const easyShare = Math.round((easySeconds / totalSeconds) * 100)

  return (
    <>
      {zones.length >= 3 && (
        <div className="flex items-baseline gap-2.5 mb-4">
          <span className="metric font-semibold text-[26px] leading-none">{easyShare} %</span>
          <span className="text-sm text-text/60">{t.heartRateZones.easyShare(formatDuration(totalSeconds))}</span>
        </div>
      )}

      <ZoneDistributionChart zones={zones} totalSeconds={totalSeconds} formatRange={formatHeartRateRange} />

      {secondsWithoutData > 0 && (
        <p className="text-xs text-text/60 mt-2">{t.heartRateZones.withoutSensor(formatDuration(secondsWithoutData))}</p>
      )}
    </>
  )
}
