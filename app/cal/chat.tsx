'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Chat() {
  const [sessionId] = useState<string>(() => Date.now().toString())
  const [input, setInput] = useState<string>('')
  const router = useRouter()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: {
        'x-session-id': sessionId,
      },
    }),
    onFinish: ({ message }) => {
      console.log('Finish')
      console.log(message)
      console.log(message.parts.some((part) => part.type.includes('event')))
      if (message.parts.some((part) => part.type.includes('event'))) {
        console.log('REFRESH')
        router.refresh()
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col w-full h-64 mx-auto">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse space-y-2 space-y-reverse p-3">
        {[...messages].reverse().map((message) => {
          const isUser = message.role === 'user'
          return (
            <div
              key={message.id}
              className={`whitespace-pre-wrap flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm border text-sm
                  ${
                    isUser
                      ? 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700'
                      : 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  }
                `}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return <div key={`${message.id}-${i}`}>{part.text}</div>
                    default:
                      // Handle dynamic tool calls (they start with 'tool-')
                      if (part.type.startsWith('tool-')) {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="my-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                          >
                            <div className="text-xs font-medium mb-1">
                              🔧 Tool Call: {part.type.replace('tool-', '')}
                            </div>
                            <details>
                              <summary>View details</summary>
                              <pre>
                                <code>{JSON.stringify(part, null, 2)}</code>
                              </pre>
                            </details>
                          </div>
                        )
                      }
                      return null
                  }
                })}
              </div>
            </div>
          )
        })}

        {status === 'streaming' && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-xs text-slate-500">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 dark:border-slate-700 w-full"
      >
        <input
          className="w-full p-3 bg-transparent dark:bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none border-none shadow-none rounded-none"
          style={{ boxShadow: 'none', border: 'none' }}
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  )
}
