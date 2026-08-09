'use client'

import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { coachDisplayName } from '@/components/chat/ConversationListItem'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatApiError, fetchMessages, listConversations, markConversationRead } from '@/lib/chat-api'
import { useChatSocket } from '@/lib/chat-socket'
import type { ChatConversation, ChatMessage } from '@/lib/types'

export function ConversationView({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { sendMessage, markRead, setTyping, onMessageNew, onMessageRead, onTyping } = useChatSocket()

  // Conversation (pour le nom/avatar du coach) + première page de messages.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const conversations = await listConversations()
        if (cancelled) return
        const found = conversations.find((c) => c.id === conversationId) ?? null
        setConversation(found)

        const page = await fetchMessages(conversationId)
        if (cancelled) return
        setMessages(page.slice().reverse())
        setHasMore(page.length > 0)

        markConversationRead(conversationId).catch(() => {})
        markRead(conversationId)
      } catch (err) {
        if (!cancelled) setError(err instanceof ChatApiError ? err.message : 'Impossible de charger la conversation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Événements temps réel.
  useEffect(() => {
    const offNew = onMessageNew((message) => {
      if (message.conversationId !== conversationId) return
      setMessages((prev) => [...prev, message])
      if (message.senderId !== currentUserId) {
        markConversationRead(conversationId).catch(() => {})
        markRead(conversationId)
      }
    })
    const offRead = onMessageRead((payload) => {
      if (payload.conversationId !== conversationId) return
      setMessages((prev) =>
        prev.map((m) => (m.senderId === currentUserId ? { ...m, readAt: m.readAt ?? payload.readAt ?? new Date().toISOString() } : m))
      )
    })
    const offTyping = onTyping((payload) => {
      if (payload.conversationId !== conversationId) return
      setIsTyping(payload.isTyping)
    })
    return () => {
      offNew()
      offRead()
      offTyping()
    }
  }, [conversationId, currentUserId, onMessageNew, onMessageRead, onTyping, markRead])

  async function loadMore() {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = messages[0]
      const page = await fetchMessages(conversationId, oldest.id)
      setMessages((prev) => [...page.slice().reverse(), ...prev])
      setHasMore(page.length > 0)
    } catch {
      // Silencieux : on retentera au prochain scroll.
    } finally {
      setLoadingMore(false)
    }
  }

  function handleSend(content: string) {
    // Pas d'ajout optimiste local : on s'appuie sur message:new, que le
    // serveur est censé rediffuser à l'émetteur aussi bien qu'au
    // destinataire (comportement standard d'une room Socket.IO).
    sendMessage(conversationId, content)
  }

  function handleTyping(typing: boolean) {
    if (conversation) setTyping(conversationId, conversation.coach.user.id, typing)
  }

  if (loading) {
    return (
      <div>
        <BackLink fallbackHref="/messages" />
        <p className="text-text/60">Chargement…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <BackLink fallbackHref="/messages" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const name = conversation ? coachDisplayName(conversation) : '…'

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <BackLink fallbackHref="/messages" />
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={name} size={40} />
        <h1 className="mb-0 text-xl">{name}</h1>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (e.currentTarget.scrollTop < 80) loadMore()
        }}
        className="flex-1 overflow-y-auto flex flex-col gap-2 pb-4"
      >
        {loadingMore && <p className="text-center text-xs text-text/50">Chargement…</p>}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.senderId === currentUserId} />
        ))}
      </div>

      {isTyping && <p className="text-xs text-text/50 mb-2">{name} est en train d&apos;écrire…</p>}

      <ChatComposer onSend={handleSend} onTyping={handleTyping} />
    </div>
  )
}
