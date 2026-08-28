'use client'

import { useState } from 'react'
import { buildWeekEntries, dayStatusStyles, findDefaultWeekIndex, type DayEntry, type WeekEntry } from '@/lib/calendar'
import { formatDistance } from '@/lib/utils'
import { WeekSummary } from './WeekSummary'
import { WorkoutModal } from './WorkoutModal'

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthCalendar({ entries }: { entries: DayEntry[] }) {
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null)
  // La semaine sélectionnée est mémorisée par sa date de début, pas par son
  // index : en changeant de mois, la grille change de taille et l'index ne
  // désigne plus la même semaine. Si la semaine mémorisée n'existe pas dans la
  // nouvelle grille, on retombe sur le défaut (semaine du jour, sinon première).
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null)

  const weeks = buildWeekEntries(entries)
  const selectedWeek = weeks.find((w) => w.startDateParam === selectedWeekStart) ?? weeks[findDefaultWeekIndex(weeks)]

  return (
    <>
      {/* Container query plutôt que breakpoint viewport : la place réellement
          disponible dépend aussi de la sidebar, qui est repliable. Sous 1180px
          de large, le récapitulatif repasse sous le calendrier. */}
      <div className="@container">
        <div className="flex flex-col @min-[1180px]:flex-row gap-4">
          <div className="min-w-0 overflow-x-auto @min-[1180px]:shrink-0">
            <div className="min-w-[720px]">
              <div className="flex gap-2 mb-1.5">
                <div className="grid grid-cols-7 gap-2 flex-1">
                  {WEEKDAY_HEADERS.map((label) => (
                    <div
                      key={label}
                      className="text-center text-[11px] font-medium uppercase tracking-wide text-text/45"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="w-20 shrink-0" />
              </div>
              <div className="flex flex-col gap-2">
                {weeks.map((week) => (
                  <div key={week.startDateParam} className="flex gap-2">
                    <div className="grid grid-cols-7 gap-2 flex-1">
                      {week.days.map((entry) => (
                        <DayCell key={entry.dateParam} entry={entry} onClick={() => setSelectedDay(entry)} />
                      ))}
                    </div>
                    <WeekCell
                      week={week}
                      isSelected={week.startDateParam === selectedWeek.startDateParam}
                      onClick={() => setSelectedWeekStart(week.startDateParam)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Le panneau ne doit pas dicter la hauteur de la ligne : en deux
              colonnes il est positionné en absolu pour épouser exactement la
              hauteur du calendrier et scroller à l'intérieur. */}
          <div className="flex-1 min-w-0 @min-[1180px]:relative">
            <div className="@min-[1180px]:absolute @min-[1180px]:inset-0 @min-[1180px]:overflow-y-auto">
              <WeekSummary week={selectedWeek} className="@min-[1180px]:min-h-full" />
            </div>
          </div>
        </div>
      </div>

      {selectedDay && <WorkoutModal entry={selectedDay} onClose={() => setSelectedDay(null)} />}
    </>
  )
}

function WeekCell({ week, isSelected, onClick }: { week: WeekEntry; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Week summary ${week.label}`}
      className={`w-20 shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 cursor-pointer transition-colors ${
        isSelected
          ? 'border-accent bg-accent-100/70'
          : 'border-dashed border-divider hover:border-solid hover:border-accent-300 hover:bg-accent-100/40'
      }`}
    >
      <span className="font-heading font-semibold text-sm">{formatDistance(week.summary.distanceM)}</span>
      <span className={`text-[9px] uppercase tracking-wide ${isSelected ? 'text-accent-700' : 'text-text/45'}`}>
        {week.shortLabel}
      </span>
    </button>
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
