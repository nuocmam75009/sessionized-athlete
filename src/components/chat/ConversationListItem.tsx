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
      className="lift sheen flex items-center gap-3.5 p-3.5 rounded-lg panel-flat"
    >
      <Avatar name={name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{name}</span>
          {last && (
            <span className="text-text/35 text-[11px] shrink-0">
              {new Date(last.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${unread ? 'font-semibold text-text' : 'text-text/50'}`}>
          {last?.content ?? 'Nouvelle conversation'}
        </p>
      </div>
      {unread && (
        <span
          className="w-2 h-2 rounded-full bg-accent-2 shadow-[0_0_10px_1px_var(--color-accent-2)] shrink-0"
          aria-label="Non lu"
        />
      )}
    </Link>
  )
}
