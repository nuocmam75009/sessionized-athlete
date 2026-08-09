import { TopBar } from '@/components/layout/TopBar'
import { ChatSocketProvider } from '@/lib/chat-socket'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatSocketProvider>
      <div className="min-h-screen">
        <TopBar />
        <main className="px-6 md:px-8 py-8 max-w-[920px]">{children}</main>
      </div>
    </ChatSocketProvider>
  )
}
