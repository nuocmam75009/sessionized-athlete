import type { Metadata } from 'next'
import { UploadView } from './UploadView'

export const metadata: Metadata = { title: 'Upload activity' }

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ workoutId?: string }>
}) {
  const { workoutId } = await searchParams
  return <UploadView initialWorkoutId={workoutId} />
}
