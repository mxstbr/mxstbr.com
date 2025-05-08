'use client'

import { useChat } from '@ai-sdk/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 5,
  })
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
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

      <form onSubmit={handleSubmit}>
        <input
          className="dark:bg-zinc-900 w-full p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
