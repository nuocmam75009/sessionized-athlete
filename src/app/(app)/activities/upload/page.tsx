import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import { UploadView } from './UploadView'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.pageTitles.upload }
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ workoutId?: string }>
}) {
  const { workoutId } = await searchParams
  return <UploadView initialWorkoutId={workoutId} />
}
