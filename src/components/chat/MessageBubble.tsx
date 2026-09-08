import type { ChatMessage } from '@/lib/types'

export function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm ${
          mine
            ? 'bg-accent text-bg shadow-[0_8px_22px_-12px_var(--color-accent)]'
            : 'panel-flat text-text'
        }`}
      >
        <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${mine ? 'text-bg/65' : 'text-text/40'}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {mine && (
            // Sur une bulle déjà bleue, l'accusé de lecture ne peut pas être une
            // seconde couleur : c'est l'opacité qui distingue envoyé de lu.
            <span className={`inline-flex ${message.readAt ? 'text-bg' : 'opacity-55'}`} aria-label={message.readAt ? 'Lu' : 'Envoyé'}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10.5L6 14.5L12 6.5" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ml-1.5">
                <path d="M2 10.5L6 14.5L12 6.5" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
