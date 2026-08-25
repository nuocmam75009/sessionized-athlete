import { notFound } from 'next/navigation'
import { ActivityDetailView } from './ActivityDetailView'
import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import type { Activity, PlannedSession } from '@/lib/types'

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { status, data: activity } = await serverApiFetchStatus<Activity>(`/activities/${id}`)
  if (status !== 200 || !activity) notFound()

  const plannedSession = activity.plannedSessionId
    ? await serverApiFetch<PlannedSession>(`/plans/${activity.plannedSessionId}`)
    : null

  return <ActivityDetailView activity={activity} plannedSession={plannedSession} />
}
