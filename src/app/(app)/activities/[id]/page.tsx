import { ActivityDetailView } from './ActivityDetailView'

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ActivityDetailView id={id} />
}
