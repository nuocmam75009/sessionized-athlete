import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment, UserProfile } from '@/lib/types'
import { ProfileView } from './ProfileView'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ strava?: string }>
}) {
  const [user, coach, strava, { strava: stravaParam }] = await Promise.all([
    serverApiFetch<UserProfile>('/users/me'),
    serverApiFetchStatus<CoachAssignment>('/users/me/coach'),
    serverApiFetchStatus<{ connected: boolean }>('/strava/status'),
    searchParams,
  ])

  return (
    <ProfileView
      user={user}
      coach={coach.status === 200 ? coach.data : null}
      stravaConnected={strava.data?.connected ?? false}
      stravaBanner={stravaParam === 'connected' || stravaParam === 'error' ? stravaParam : null}
    />
  )
}
