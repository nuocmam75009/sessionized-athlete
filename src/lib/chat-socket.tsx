'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ChatMessage } from './types'

interface TypingEvent {
  conversationId: string
  userId?: string
  isTyping: boolean
}

interface MessageReadEvent {
  conversationId: string
  readAt?: string
}

type Unsubscribe = () => void

interface ChatSocketContextValue {
  connected: boolean
  sendMessage: (conversationId: string, content: string) => void
  markRead: (conversationId: string) => void
  setTyping: (conversationId: string, recipientUserId: string, isTyping: boolean) => void
  onMessageNew: (handler: (message: ChatMessage) => void) => Unsubscribe
  onConversationUpdated: (handler: (conversationId: string) => void) => Unsubscribe
  onMessageRead: (handler: (payload: MessageReadEvent) => void) => Unsubscribe
  onTyping: (handler: (payload: TypingEvent) => void) => Unsubscribe
}

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null)

async function fetchSocketToken(): Promise<string | null> {
  const res = await fetch('/api/chat/socket-token')
  if (!res.ok) return null
  const { token } = await res.json()
  return token as string
}

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  // Un Set par type d'événement : plusieurs écrans (liste + conversation
  // ouverte) peuvent écouter en même temps sans s'écraser les uns les autres.
  const messageNewHandlers = useRef(new Set<(m: ChatMessage) => void>())
  const conversationUpdatedHandlers = useRef(new Set<(id: string) => void>())
  const messageReadHandlers = useRef(new Set<(p: MessageReadEvent) => void>())
  const typingHandlers = useRef(new Set<(p: TypingEvent) => void>())

  useEffect(() => {
    let cancelled = false
    let erroredOnce = false

    function bindListeners(socket: Socket) {
      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))
      socket.on('message:new', (message: ChatMessage) => {
        for (const handler of messageNewHandlers.current) handler(message)
      })
      socket.on('conversation:updated', (payload: { conversationId: string }) => {
        for (const handler of conversationUpdatedHandlers.current) handler(payload.conversationId)
      })
      socket.on('message:read', (payload: MessageReadEvent) => {
        for (const handler of messageReadHandlers.current) handler(payload)
      })
      socket.on('typing', (payload: TypingEvent) => {
        for (const handler of typingHandlers.current) handler(payload)
      })

      // Token invalide/expiré : le serveur émet `error` puis déconnecte.
      // On retente une fois avec un token frais (relu depuis le cookie
      // httpOnly) ; au-delà, on laisse déconnecté plutôt que boucler.
      socket.on('error', async () => {
        socket.disconnect()
        setConnected(false)
        if (cancelled || erroredOnce) return
        erroredOnce = true

        const freshToken = await fetchSocketToken()
        if (!freshToken || cancelled) return

        const retried = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, { auth: { token: freshToken } })
        socketRef.current = retried
        bindListeners(retried)
      })
    }

    async function connect() {
      const token = await fetchSocketToken()
      if (!token || cancelled) return

      const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      })
      socketRef.current = socket
      bindListeners(socket)
    }

    connect()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  const value = useMemo<ChatSocketContextValue>(
    () => ({
      connected,
      sendMessage: (conversationId, content) => socketRef.current?.emit('message:send', { conversationId, content }),
      markRead: (conversationId) => socketRef.current?.emit('conversation:read', { conversationId }),
      setTyping: (conversationId, recipientUserId, isTyping) =>
        socketRef.current?.emit('typing', { conversationId, recipientUserId, isTyping }),
      onMessageNew: (handler) => {
        messageNewHandlers.current.add(handler)
        return () => messageNewHandlers.current.delete(handler)
      },
      onConversationUpdated: (handler) => {
        conversationUpdatedHandlers.current.add(handler)
        return () => conversationUpdatedHandlers.current.delete(handler)
      },
      onMessageRead: (handler) => {
        messageReadHandlers.current.add(handler)
        return () => messageReadHandlers.current.delete(handler)
      },
      onTyping: (handler) => {
        typingHandlers.current.add(handler)
        return () => typingHandlers.current.delete(handler)
      },
    }),
    [connected]
  )

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext)
  if (!ctx) throw new Error('useChatSocket must be used within ChatSocketProvider')
  return ctx
}
