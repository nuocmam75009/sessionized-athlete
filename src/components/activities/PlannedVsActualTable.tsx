'use client'

import { thClass, tdClass } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import type { formatActivity } from '@/lib/activity-format'
import type { workoutTargets } from '@/lib/plan-format'

export function PlannedVsActualTable({
  planned,
  actual,
}: {
  planned: ReturnType<typeof workoutTargets>
  actual: ReturnType<typeof formatActivity>
}) {
  const { t } = useI18n()
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className={thClass}>{t.plan.metric}</th>
          <th className={thClass}>{t.plan.planned}</th>
          <th className={thClass}>{t.plan.actual}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={`${tdClass} text-text/60`}>{t.stats.distance}</td>
          <td className={`${tdClass} metric text-text/60`}>{planned.distance}</td>
          <td className={`${tdClass} metric font-semibold`}>{actual.distance}</td>
        </tr>
        <tr>
          <td className={`${tdClass} text-text/60`}>{t.stats.duration}</td>
          <td className={`${tdClass} metric text-text/60`}>{planned.duration}</td>
          <td className={`${tdClass} metric font-semibold`}>{actual.duration}</td>
        </tr>
        <tr>
          <td className={`${tdClass} text-text/60`}>{t.plan.avgPaceTarget}</td>
          <td className={`${tdClass} metric text-text/60`}>{planned.pace}</td>
          <td className={`${tdClass} metric font-semibold`}>{actual.pace}</td>
        </tr>
      </tbody>
    </table>
  )
}
