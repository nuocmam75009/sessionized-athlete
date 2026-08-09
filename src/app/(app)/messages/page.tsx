import { serverApiFetch } from '@/lib/server-api'
import type { UserProfile } from '@/lib/types'
import { MessagesView } from './MessagesView'

export default async function MessagesPage() {
  const user = await serverApiFetch<UserProfile>('/users/me')
  return <MessagesView currentUserId={user?.id ?? ''} />
}
