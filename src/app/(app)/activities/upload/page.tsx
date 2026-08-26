import { UploadView } from './UploadView'

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ workoutId?: string }>
}) {
  const { workoutId } = await searchParams
  return <UploadView initialWorkoutId={workoutId} />
}
