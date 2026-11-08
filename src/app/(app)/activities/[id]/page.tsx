import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActivityDetailView } from './ActivityDetailView'
import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import { isValidId } from '@/lib/utils'
import type { Activity, Workout } from '@/lib/types'

export const metadata: Metadata = { title: 'Activity' }

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidId(id)) notFound()

  const { status, data: activity } = await serverApiFetchStatus<Activity>(`/activities/${id}`)
  // 403 (activité d'un autre athlète) rendu comme 404 : la page ne dit pas
  // qu'un identifiant existe quand il n'est pas à soi.
  if (status === 404 || status === 403) notFound()
  // API en panne : afficher « introuvable » serait faux, error.tsx propose
  // plutôt de réessayer.
  if (status !== 200 || !activity) throw new Error(`GET /activities/${id} returned ${status}`)

  const workout = activity.workoutId
    ? await serverApiFetch<Workout>(`/workouts/${activity.workoutId}`)
    : null

  return <ActivityDetailView activity={activity} workout={workout} />
}
