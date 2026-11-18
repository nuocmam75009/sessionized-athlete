'use client'

import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import {
  buildWeekEntries,
  dayStatusStyles,
  findDefaultWeekIndex,
  formatWeekRangeLabel,
  formatWeekShortLabel,
  type DayEntry,
  type WeekEntry,
} from '@/lib/calendar'
import { toSportKind } from '@/lib/sport'
import { formatDistance } from '@/lib/utils'
import { WeekSummary } from './WeekSummary'
import { WorkoutModal } from './WorkoutModal'

// Espacements et largeur de la colonne des semaines, resserrés sous 720px de
// conteneur : huit colonnes doivent tenir dans un écran de 320px.
const GRID_GAP = 'gap-1 @min-[720px]:gap-2'
const WEEK_CELL_WIDTH = 'w-10 @min-[720px]:w-20'

export function MonthCalendar({ entries }: { entries: DayEntry[] }) {
  const { t } = useI18n()
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
          de large, le récapitulatif repasse sous le calendrier ; sous 720px,
          la grille passe en version compacte (voir DayCell et WeekCell). */}
      <div className="@container">
        <div className="flex flex-col @min-[1180px]:flex-row gap-4">
          {/* Plus de défilement horizontal : sur téléphone, la grille de 720px
              ne montrait que du lundi au jeudi, et le libellé sr-only des cases
              de semaine (en position absolue, sans ancêtre positionné) sortait
              du conteneur et élargissait la page à 705px. La grille compacte
              tient dans n'importe quelle largeur ; la complète n'apparaît
              qu'une fois la place disponible. */}
          <div className="min-w-0 @min-[1180px]:shrink-0">
            <div className="@min-[720px]:min-w-[720px]">
              <div className={`flex ${GRID_GAP} mb-1.5`}>
                <div className={`grid grid-cols-7 ${GRID_GAP} flex-1`}>
                  {t.calendar.weekdays.map((label) => (
                    <div
                      key={label}
                      className="text-center text-[10px] font-medium uppercase tracking-[0.12em] text-text/60"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className={`${WEEK_CELL_WIDTH} shrink-0`} />
              </div>
              <div className={`flex flex-col ${GRID_GAP}`}>
                {weeks.map((week) => (
                  <div key={week.startDateParam} className={`flex ${GRID_GAP}`}>
                    <div className={`grid grid-cols-7 ${GRID_GAP} flex-1`}>
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
  const { locale, t } = useI18n()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      // relative : borne le libellé sr-only (absolu) à la case.
      className={`lift relative ${WEEK_CELL_WIDTH} shrink-0 flex flex-col items-center justify-center gap-1 rounded-md @min-[720px]:rounded-lg border px-0.5 @min-[720px]:px-1 cursor-pointer ${
        // La semaine sélectionnée est la seule à porter un halo : c'est ce qui
        // relie la ligne du calendrier au panneau de récapitulatif à sa droite.
        isSelected
          ? 'border-accent/60 bg-accent/10 glow-accent'
          : 'border-dashed border-divider bg-surface/30 hover:border-solid'
      }`}
    >
      {/* Nom accessible = ce texte + le visible (WCAG 2.5.3 : le nom doit contenir
          le texte affiché, pour la commande vocale). */}
      <span className="sr-only">
        {t.calendar.weekSummaryOf(formatWeekRangeLabel(week.startDateParam, week.endDateParam, locale))}
      </span>
      {/* En compact, « 26.4 km » passe sur deux lignes (chiffre, puis unité) et
          les dates de la semaine disparaissent : elles sont déjà sur la ligne
          de cases, et le nom accessible les garde. */}
      <span className="metric font-semibold text-[11px] @min-[720px]:text-[13px] text-center leading-tight">
        {formatDistance(week.summary.distanceM, locale)}
      </span>
      <span
        className={`hidden @min-[720px]:inline text-[9px] uppercase tracking-[0.1em] ${isSelected ? 'text-accent-700' : 'text-text/60'}`}
      >
        {formatWeekShortLabel(week.startDateParam, week.endDateParam, locale)}
      </span>
    </button>
  )
}

function DayCell({ entry, onClick }: { entry: DayEntry; onClick: () => void }) {
  const { t } = useI18n()
  const { dotClass, bgClass, borderClass } = dayStatusStyles(entry.status)
  const firstUnplanned = entry.unplannedActivities[0]
  // Libellé normalisé plutôt que la chaîne brute de la montre ou de Strava :
  // "running" et "TrailRun" côtoyaient "Run" et "Trail run" du récapitulatif.
  const title = entry.workout?.title ?? (firstUnplanned ? t.sports[toSportKind(firstUnplanned.sport)] : null)

  return (
    <button
      type="button"
      onClick={onClick}
      // Pas de `sheen` sur les cases : le balayage lumineux ajoutait un
      // pseudo-élément et un contexte d'empilement à chacune des 42 cases de la
      // grille, pour un reflet à peine perceptible sur 100px de large.
      // Sous 720px, une case fait ~40px de large : elle ne garde que le numéro
      // et la pastille (et la teinte) du statut. Libellé et titre passent en
      // sr-only — toujours dans le nom accessible, `relative` les bornant à la
      // case — et se lisent en clair dans la modale ou le « Jour par jour ».
      className={`lift group relative flex flex-col items-center h-14 @min-[720px]:h-24 rounded-md @min-[720px]:rounded-lg border px-0 @min-[720px]:px-2 py-1.5 @min-[720px]:py-2 cursor-pointer ${borderClass} ${bgClass} ${
        // Le jour courant est le seul repère permanent de la grille : halo plutôt
        // qu'anneau, pour qu'il se voie sans ajouter un second trait à la case.
        entry.isToday ? 'glow-accent' : ''
      } ${entry.isInCurrentMonth ? '' : 'opacity-35'}`}
    >
      <div
        className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-[13px] metric font-semibold mb-1 @min-[720px]:mb-1.5 transition-colors ${
          entry.isToday
            ? 'bg-accent text-bg shadow-[0_4px_14px_-4px_var(--color-accent)]'
            : 'text-text/85 group-hover:bg-text/[0.07]'
        }`}
      >
        {entry.dayNumber}
      </div>

      {entry.status !== 'empty' && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="sr-only @min-[720px]:not-sr-only text-[9px] uppercase tracking-[0.09em] text-text/60">
            {t.calendar.status[entry.status]}
          </span>
        </div>
      )}

      {/* Deux niveaux : not-sr-only remet overflow à visible, ce qui annulerait
          le line-clamp s'ils étaient posés sur le même élément. */}
      <div className="sr-only @min-[720px]:not-sr-only">
        <div className="text-[10px] text-text/60 text-center leading-snug line-clamp-2">
          {title}
          {entry.unplannedActivities.length > 1 && (
            <span className="text-text/60"> +{entry.unplannedActivities.length - 1}</span>
          )}
        </div>
      </div>
    </button>
  )
}
