import { serverApiFetch, serverApiFetchStatus } from '@/lib/server-api'
import type { CoachAssignment, UserProfile } from '@/lib/types'
import { ProfileView } from './ProfileView'

export default async function ProfilePage() {
  const [user, coach] = await Promise.all([
    serverApiFetch<UserProfile>('/users/me'),
    serverApiFetchStatus<CoachAssignment>('/users/me/coach'),
  ])

  return <ProfileView user={user} coach={coach.status === 200 ? coach.data : null} />
}
