import type { Metadata } from 'next'
import { TrainingAnalysis } from '@/components/training/TrainingAnalysis'
import { getI18n } from '@/lib/i18n/server'
import { serverApiFetchStatus } from '@/lib/server-api'
import type { Activity, Workout } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.trainings }
}

export default async function TrainingsPage() {
  // Toutes les activités, pas seulement ?training=true : la part des séances
  // de qualité se calcule sur l'ensemble de la période. Les workouts ne
  // servent qu'à reprendre le titre de la séance prescrite.
  const [activitiesRes, workoutsRes, { t }] = await Promise.all([
    serverApiFetchStatus<Activity[]>('/activities'),
    serverApiFetchStatus<Workout[]>('/workouts'),
    getI18n(),
  ])
  const ta = t.trainingAnalysis

  return (
    <div>
      <div className="font-heading font-semibold text-[10px] tracking-[0.18em] uppercase text-accent mb-2.5">
        {ta.eyebrow}
      </div>
      <h1 className="mb-2">{ta.title}</h1>
      <p className="text-sm text-text/60 mb-7 max-w-[60ch]">{ta.intro}</p>

      {/* Sans ce signalement, une API en panne se lirait comme un historique
          sans séance de qualité. */}
      {!activitiesRes.data && (
        <p role="alert" className="panel-flat rounded-md px-4 py-3 mb-4 text-sm text-danger">
          {ta.loadFailed}
        </p>
      )}
      <TrainingAnalysis
        activities={activitiesRes.data ?? []}
        workouts={workoutsRes.data ?? []}
        now={new Date().toISOString()}
      />
    </div>
  )
}
