import { AthleteSidebar } from '@/components/layout/AthleteSidebar'
import { ChatSocketProvider } from '@/lib/chat-socket'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatSocketProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AthleteSidebar />
        <main className="flex-1 px-6 md:px-8 py-8 max-w-[920px]">{children}</main>
      </div>
    </ChatSocketProvider>
  )
}
