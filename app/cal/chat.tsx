'use client'

import { useChat } from '@ai-sdk/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 5,
  })
  return (
    <div className="flex flex-col w-full max-w-md h-64 mx-auto">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse space-y-2 space-y-reverse pr-1">
        {messages
          .slice()
          .reverse()
          .map((message) => (
            <div key={message.id} className="whitespace-pre-wrap">
              {message.role === 'user' ? 'User: ' : 'AI: '}
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id}-${i}`}>{part.text}</div>
                  case 'tool-invocation':
                    return (
                      <pre key={`${message.id}-${i}`}>
                        {JSON.stringify(part.toolInvocation, null, 2)}
                      </pre>
                    )
                }
              })}
            </div>
          ))}
      </div>

      <form onSubmit={handleSubmit} className="pt-2">
        <input
          className="dark:bg-zinc-900 w-full p-2 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
