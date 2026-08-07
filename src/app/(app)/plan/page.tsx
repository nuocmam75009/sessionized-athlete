import { Badge } from '@/components/ui/Badge'
import { RowLink } from '@/components/ui/RowLink'
import { thClass, tdClass } from '@/components/ui/table'
import { WEEK, tagVariant, labelFor } from '@/lib/mock-data'

export default function PlanPage() {
  return (
    <div>
      <h1>This week</h1>
      <p className="opacity-70 mb-5">Aug 3 – Aug 9, 2026</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={thClass}>Day</th>
            <th className={thClass}>Session</th>
            <th className={thClass}>Target</th>
            <th className={thClass}>Status</th>
          </tr>
        </thead>
        <tbody>
          {WEEK.map((row) => (
            <RowLink key={row.id} href={row.type === 'rest' ? undefined : `/activities/${row.id}`}>
              <td className={tdClass}>
                <div className="font-semibold">{row.day}</div>
                <div className="text-text/60 text-xs">{row.date}</div>
              </td>
              <td className={tdClass}>{row.title}</td>
              <td className={`${tdClass} text-text/60`}>{row.type === 'rest' ? '—' : row.targetZone}</td>
              <td className={tdClass}>
                <Badge variant={tagVariant(row.status)}>{labelFor(row.status)}</Badge>
              </td>
            </RowLink>
          ))}
        </tbody>
      </table>
    </div>
  )
}
