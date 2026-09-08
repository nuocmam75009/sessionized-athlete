'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'

interface ChatComposerProps {
  onSend: (content: string) => void
  onTyping: (isTyping: boolean) => void
}

export function ChatComposer({ onSend, onTyping }: ChatComposerProps) {
  const [content, setContent] = useState('')
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setContent(value)
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 2000)
  }

  function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
    onTyping(false)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }

  return (
    <div className="flex gap-2 items-end border-t border-divider pt-4">
      <Textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Écris un message…"
        className="flex-1 min-h-11 max-h-32"
        maxLength={2000}
      />
      <Button onClick={submit} disabled={!content.trim()}>
        Envoyer
      </Button>
    </div>
  )
}
