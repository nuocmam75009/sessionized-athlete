'use client'

import { useState } from 'react'
import { buildWeekEntries, dayStatusStyles, type DayEntry } from '@/lib/calendar'
import { formatDistance } from '@/lib/utils'
import { WorkoutModal } from './WorkoutModal'

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthCalendar({ entries }: { entries: DayEntry[] }) {
  const [selected, setSelected] = useState<DayEntry | null>(null)
  const weeks = buildWeekEntries(entries)

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex gap-2 mb-1.5">
            <div className="grid grid-cols-7 gap-2 flex-1">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="text-center text-[11px] font-medium uppercase tracking-wide text-text/45">
                  {label}
                </div>
              ))}
            </div>
            <div className="w-20 shrink-0" />
          </div>
          <div className="flex flex-col gap-2">
            {weeks.map((week, i) => (
              <div key={i} className="flex gap-2">
                <div className="grid grid-cols-7 gap-2 flex-1">
                  {week.days.map((entry) => (
                    <DayCell key={entry.dateParam} entry={entry} onClick={() => setSelected(entry)} />
                  ))}
                </div>
                <div className="w-20 shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-divider">
                  <span className="font-heading font-semibold text-sm">{formatDistance(week.distanceM)}</span>
                  <span className="text-[9px] uppercase tracking-wide text-text/45">this week</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selected && <WorkoutModal entry={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function DayCell({ entry, onClick }: { entry: DayEntry; onClick: () => void }) {
  const { dotClass, bgClass, borderClass, label } = dayStatusStyles(entry.status)
  const firstUnplanned = entry.unplannedActivities[0]
  const title = entry.workout?.title ?? (firstUnplanned ? (firstUnplanned.sport ?? 'Activity') : null)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center h-24 rounded-lg border px-2 py-2 cursor-pointer transition-colors hover:border-divider ${borderClass} ${bgClass} ${
        entry.isToday ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg' : ''
      } ${entry.isInCurrentMonth ? '' : 'opacity-40'}`}
    >
      <div
        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-heading font-semibold mb-1 transition-colors ${
          entry.isToday ? 'bg-accent text-bg' : 'text-text group-hover:bg-text/[0.06]'
        }`}
      >
        {entry.dayNumber}
      </div>

      {dotClass && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-[9px] uppercase tracking-wide text-text/50">{label}</span>
        </div>
      )}

      <div className="text-[10px] text-text/70 text-center leading-snug line-clamp-2">
        {title}
        {entry.unplannedActivities.length > 1 && (
          <span className="text-text/50"> +{entry.unplannedActivities.length - 1}</span>
        )}
      </div>
    </button>
  )
}
