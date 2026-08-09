'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationListItem } from '@/components/chat/ConversationListItem'
import { ChatApiError, listConversations } from '@/lib/chat-api'
import { useChatSocket } from '@/lib/chat-socket'
import type { ChatConversation } from '@/lib/types'

export function MessagesView({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { onConversationUpdated, onMessageNew } = useChatSocket()

  const refresh = useCallback(async () => {
    try {
      const data = await listConversations()
      data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setConversations(data)
    } catch (err) {
      setError(err instanceof ChatApiError ? err.message : 'Impossible de charger les conversations.')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const offUpdated = onConversationUpdated(() => refresh())
    const offNew = onMessageNew(() => refresh())
    return () => {
      offUpdated()
      offNew()
    }
  }, [onConversationUpdated, onMessageNew, refresh])

  return (
    <div>
      <h1>Messages</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {conversations === null && !error && <p className="text-text/60 mt-5">Chargement…</p>}
      {conversations?.length === 0 && <p className="text-text/60 mt-5">Aucune conversation pour l&apos;instant.</p>}
      <div className="grid gap-2 mt-5 max-w-[560px]">
        {conversations?.map((c) => (
          <ConversationListItem key={c.id} conversation={c} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  )
}
