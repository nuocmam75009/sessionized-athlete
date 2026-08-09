import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import type { ChatConversation } from '@/lib/types'

export function coachDisplayName(conversation: ChatConversation) {
  const { firstName, lastName, email } = conversation.coach.user
  return [firstName, lastName].filter(Boolean).join(' ') || email
}

export function ConversationListItem({
  conversation,
  currentUserId,
}: {
  conversation: ChatConversation
  currentUserId: string
}) {
  const last = conversation.messages[0]
  const unread = !!last && last.senderId !== currentUserId && !last.readAt
  const name = coachDisplayName(conversation)

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 p-3 rounded-md bg-surface hover:bg-text/[0.04] transition-colors"
    >
      <Avatar name={name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{name}</span>
          {last && (
            <span className="text-text/50 text-xs shrink-0">
              {new Date(last.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${unread ? 'font-semibold text-text' : 'text-text/60'}`}>
          {last?.content ?? 'Nouvelle conversation'}
        </p>
      </div>
      {unread && <span className="w-2.5 h-2.5 rounded-full bg-accent-2 shrink-0" aria-label="Non lu" />}
    </Link>
  )
}
