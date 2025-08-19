import Chat from '../cal/chat'
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <img 
              src="/static/images/windows_98_icons/clippy.webp" 
              alt="Clippy" 
              className="w-8 h-8"
              style={{ imageRendering: 'pixelated' }}
            />
            Clippy Assistant
          </h1>
          <p className="text-slate-600 mt-2">
            Hi! I'm Clippy, your AI assistant. How can I help you today?
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Chat />
        </div>
      </div>
    </div>
  )
}
