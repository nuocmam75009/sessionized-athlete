import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { serverApiFetch } from '@/lib/server-api'
import type { UserProfile } from '@/lib/types'
import { AthleteDataView } from './AthleteDataView'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.athleteData }
}

export default async function AthleteDataPage() {
  const user = await serverApiFetch<UserProfile>('/users/me')
  return <AthleteDataView athleteProfile={user?.athleteProfile ?? null} loadFailed={!user} />
}
