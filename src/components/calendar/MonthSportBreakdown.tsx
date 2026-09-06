'use client'

import dynamic from 'next/dynamic'
import { SportBreakdownTable } from './SportBreakdownTable'
import type { SportBreakdown } from '@/lib/calendar'

// Recharts pèse une centaine de ko : chargé à la demande, comme pour le graphe
// des zones de FC. Le conteneur réserve le carré du donut pour éviter un saut
// de mise en page au chargement.
const SportHoursChart = dynamic(() => import('@/components/charts/SportHoursChart').then((m) => m.SportHoursChart), {
  ssr: false,
})

const CHART_SIZE_PX = 180

// Où est passé le temps du mois, par sport : le donut pour la répartition, le
// tableau pour les chiffres exacts — il sert aussi de légende, chaque sport y
// portant sa couleur, et de repli lisible quand la couleur ne suffit pas.
export function MonthSportBreakdown({ bySport }: { bySport: SportBreakdown[] }) {
  // Un seul sport sur le mois : un donut d'une seule part n'apprend rien, et le
  // tableau ne ferait que répéter les totaux affichés juste au-dessus.
  if (bySport.length < 2) return null

  // Le tableau suit l'ordre du donut (par durée) et non son tri par défaut
  // (par distance) : côte à côte, deux ordres différents pour les mêmes sports
  // se lisent mal.
  const byHours = [...bySport].sort((a, b) => b.durationSec - a.durationSec)

  return (
    <div className="mt-6 max-w-[720px]">
      <h4 className="text-[11px] uppercase tracking-[0.08em] text-text/55 mb-4 pb-2 border-b border-divider">
        Hours by sport
      </h4>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div style={{ width: CHART_SIZE_PX, height: CHART_SIZE_PX }} className="shrink-0">
          <SportHoursChart bySport={byHours} />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <SportBreakdownTable bySport={byHours} />
        </div>
      </div>
    </div>
  )
}
