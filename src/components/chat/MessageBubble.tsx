import type { ChatMessage } from '@/lib/types'

export function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${mine ? 'bg-accent text-bg' : 'bg-surface text-text'}`}>
        <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${mine ? 'text-bg/70' : 'text-text/50'}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {mine && (
            <span className={`inline-flex ${message.readAt ? 'text-accent-2' : 'opacity-70'}`} aria-label={message.readAt ? 'Lu' : 'Envoyé'}>
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
