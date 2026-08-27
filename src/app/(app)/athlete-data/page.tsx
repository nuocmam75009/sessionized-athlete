import { serverApiFetch } from '@/lib/server-api'
import type { UserProfile } from '@/lib/types'
import { AthleteDataView } from './AthleteDataView'

export default async function AthleteDataPage() {
  const user = await serverApiFetch<UserProfile>('/users/me')
  return <AthleteDataView athleteProfile={user?.athleteProfile ?? null} />
}
