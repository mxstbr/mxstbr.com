import Chat from '../../(os)/cal/chat'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Clippy - AI Assistant',
  description: 'Chat with Clippy, your AI assistant',
}

export default function ClippyPage() {
  return (
    <div className="h-screen bg-white">
      <Chat />
    </div>
  )
}
