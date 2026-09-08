import { AthleteSidebar } from '@/components/layout/AthleteSidebar'
import { ChatSocketProvider } from '@/lib/chat-socket'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatSocketProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AthleteSidebar />
        {/* Les pages sont cadrées à 920px par défaut (confort de lecture d'une
            colonne). Une page qui a besoin de plus — le dashboard et ses deux
            colonnes calendrier + récapitulatif — pose data-wide sur sa racine. */}
        <main className="flex-1 px-6 md:px-10 py-10 w-full max-w-[920px] has-data-wide:max-w-none">
          {children}
        </main>
      </div>
    </ChatSocketProvider>
  )
}
