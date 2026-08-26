import { notFound } from 'next/navigation'
import { ActivityDetailView } from './ActivityDetailView'
import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import type { Activity, Workout } from '@/lib/types'

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { status, data: activity } = await serverApiFetchStatus<Activity>(`/activities/${id}`)
  if (status !== 200 || !activity) notFound()

  const workout = activity.workoutId
    ? await serverApiFetch<Workout>(`/workouts/${activity.workoutId}`)
    : null

  return <ActivityDetailView activity={activity} workout={workout} />
}
