import { serverApiFetch } from '@/lib/server-api'
import type { UserProfile } from '@/lib/types'
import { ConversationView } from './ConversationView'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await serverApiFetch<UserProfile>('/users/me')
  return <ConversationView conversationId={id} currentUserId={user?.id ?? ''} />
}
