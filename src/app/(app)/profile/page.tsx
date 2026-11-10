import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment, UserProfile } from '@/lib/types'
import { ProfileView } from './ProfileView'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.profile }
}

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
      stravaBanner={
        stravaParam === 'connected' || stravaParam === 'error' || stravaParam === 'reconnect' ? stravaParam : null
      }
    />
  )
}
