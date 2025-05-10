'use client'

import { useChat } from '@ai-sdk/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';

export default function Chat() {
  const [sessionId, setSessionId] = useState<string>('')
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    maxSteps: 5,
    headers: {
      'x-session-id': sessionId
    }
  })

  useEffect(() => {
    setSessionId(Date.now().toString())
  }, [])

  // Refresh the page when an event is edited
  useEffect(() => {
    if (status !== 'ready') return;

    const aiMessage = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!aiMessage) return;

    const toolResult = aiMessage.parts.find(parts => parts.type === "tool-invocation")
    if (!toolResult) return;

    if (toolResult.toolInvocation.toolName === "create_event" || toolResult.toolInvocation.toolName === "update_event" || toolResult.toolInvocation.toolName === "delete_event") {
      router.refresh();
    }
  }, [status, messages])

  return (
    <div className="flex flex-col w-full h-64 mx-auto">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse space-y-2 space-y-reverse p-3">
        {[...messages].reverse().map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`whitespace-pre-wrap flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm border text-sm
                  ${isUser
                    ? 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700'
                    : 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'}
                `}
              >
                <div className="font-semibold mb-1 opacity-70 text-xs">
                  {isUser ? 'User' : 'AI'}
                </div>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return <div key={`${message.id}-${i}`}>{part.text}</div>
                    case 'tool-invocation':
                      const { toolName, toolCallId, args, state } = part.toolInvocation;
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          className="my-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="text-sm text-yellow-700 dark:text-yellow-200">
                                <span className="font-medium">{toolName}</span>
                                {state === 'result' ? (
                                  <span className="ml-1">completed successfully</span>
                                ) : (
                                  <span className="ml-1">in progress...</span>
                                )}
                              </div>
                              {args && Object.keys(args).length > 0 && (
                                <div className="mt-1 text-xs text-yellow-800 dark:text-yellow-300">
                                  with parameters: {Object.entries(args).map(([key, value]) => (
                                    <span key={key} className="inline-block mr-2">
                                      <span className="font-medium">{key}</span>: {JSON.stringify(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <details className="mt-1">
                            <summary className="text-xs text-yellow-700 dark:text-yellow-200 cursor-pointer hover:text-yellow-900 dark:hover:text-yellow-100">
                              View technical details
                            </summary>
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-800 rounded text-xs overflow-x-auto">
                              <div className="font-mono">
                                <div>ID: {toolCallId}</div>
                                <div>Tool: {toolName}</div>
                                <div>State: {state}</div>
                                {args && (
                                  <div>
                                    Args: <pre className="mt-1">{JSON.stringify(args, null, 2)}</pre>
                                  </div>
                                )}
                                {state === 'result' && 'result' in part.toolInvocation && (
                                  <div>
                                    Result: <pre className="mt-1">{JSON.stringify(part.toolInvocation.result, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </details>
                        </div>
                      )
                  }
                })}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-slate-700 w-full">
        <input
          className="w-full p-3 bg-transparent dark:bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:outline-none border-none shadow-none rounded-none"
          style={{ boxShadow: 'none', border: 'none' }}
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
