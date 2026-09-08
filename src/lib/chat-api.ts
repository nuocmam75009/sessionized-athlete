import type { ChatConversation, ChatMessage } from './types'

export class ChatApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function messageForStatus(status: number, fallback: string) {
  if (status === 401) return 'Tu dois être connecté.'
  if (status === 403) return "Ce coach n'est plus disponible."
  if (status === 404) return 'Conversation introuvable.'
  return fallback
}

async function unwrap<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) throw new ChatApiError(res.status, messageForStatus(res.status, fallback))
  return res.json()
}

export async function listConversations(): Promise<ChatConversation[]> {
  const res = await fetch('/api/chat/conversations')
  return unwrap(res, 'Impossible de charger les conversations.')
}

export async function startConversation(
  targetId: string,
  content: string
): Promise<{ conversation: ChatConversation; message: ChatMessage }> {
  const res = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, content }),
  })
  return unwrap(res, 'Impossible de démarrer la conversation.')
}

// L'API renvoie du plus récent au plus ancien ; cursor = id du message le
// plus ancien déjà chargé, pour charger la page précédente en scrollant vers
// le haut.
export async function fetchMessages(conversationId: string, cursor?: string, limit = 30): Promise<ChatMessage[]> {
  const query = new URLSearchParams({ limit: String(limit) })
  if (cursor) query.set('cursor', cursor)
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages?${query.toString()}`)
  return unwrap(res, 'Impossible de charger les messages.')
}

export async function sendMessageRest(conversationId: string, content: string): Promise<ChatMessage> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return unwrap(res, "Impossible d'envoyer le message.")
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'PATCH' })
  if (!res.ok) throw new ChatApiError(res.status, messageForStatus(res.status, 'Impossible de marquer comme lu.'))
}
