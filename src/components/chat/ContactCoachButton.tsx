'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { ChatApiError, listConversations, startConversation } from '@/lib/chat-api'

interface ContactCoachButtonProps {
  coachId: string
  coachName: string
  label?: string
}

// Utilisé à la fois depuis la fiche coach de la marketplace et depuis "mon
// coach" sur le profil — même logique : rouvrir la conversation existante
// s'il y en a une, sinon composer le premier message.
export function ContactCoachButton({ coachId, coachName, label = 'Contacter' }: ContactCoachButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function redirectToLogin() {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  async function openOrCompose() {
    setError(null)
    setChecking(true)
    try {
      const conversations = await listConversations()
      const existing = conversations.find((c) => c.coach.id === coachId)
      if (existing) {
        router.push(`/messages/${existing.id}`)
        return
      }
      setOpen(true)
    } catch (err) {
      if (err instanceof ChatApiError && err.status === 401) {
        redirectToLogin()
        return
      }
      setError(err instanceof ChatApiError ? err.message : 'Impossible de vérifier tes conversations.')
    } finally {
      setChecking(false)
    }
  }

  async function send() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      const { conversation } = await startConversation(coachId, trimmed)
      router.push(`/messages/${conversation.id}`)
    } catch (err) {
      if (err instanceof ChatApiError && err.status === 401) {
        redirectToLogin()
        return
      }
      setError(err instanceof ChatApiError ? err.message : "Échec de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-2">
        <Button variant="secondary" onClick={openOrCompose} disabled={checking}>
          {checking ? '…' : label}
        </Button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-2 mt-2 max-w-[420px]">
      <Textarea
        placeholder={`Écris un message à ${coachName}…`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
      />
      <div className="flex gap-2 items-center">
        <Button onClick={send} disabled={sending || !content.trim()}>
          {sending ? 'Envoi…' : 'Envoyer'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
          Annuler
        </Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
