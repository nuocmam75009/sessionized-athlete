import { thClass, tdClass } from '@/components/ui/table'
import type { formatActivity } from '@/lib/activity-format'
import type { workoutTargets } from '@/lib/plan-format'

export function PlannedVsActualTable({
  planned,
  actual,
}: {
  planned: ReturnType<typeof workoutTargets>
  actual: ReturnType<typeof formatActivity>
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className={thClass}>Metric</th>
          <th className={thClass}>Planned</th>
          <th className={thClass}>Actual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={`${tdClass} text-text/60`}>Distance</td>
          <td className={tdClass}>{planned.distance}</td>
          <td className={`${tdClass} font-semibold`}>{actual.distance}</td>
        </tr>
        <tr>
          <td className={`${tdClass} text-text/60`}>Duration</td>
          <td className={tdClass}>{planned.duration}</td>
          <td className={`${tdClass} font-semibold`}>{actual.duration}</td>
        </tr>
        <tr>
          <td className={`${tdClass} text-text/60`}>Avg pace / target</td>
          <td className={tdClass}>{planned.pace}</td>
          <td className={`${tdClass} font-semibold`}>{actual.pace}</td>
        </tr>
      </tbody>
    </table>
  )
}
