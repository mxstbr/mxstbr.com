import { Redis } from '@upstash/redis'
import { isMax } from 'app/auth'
import { redirect } from 'next/navigation'

// Redis client initialization
const redis = Redis.fromEnv()

// Types for log data
type ToolCall = {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state?: string;
  result?: any;
}

type ToolResult = {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  result: any;
}

type LogStep = {
  stepType: string;
  text: string;
  reasoningDetails: any[];
  files: any[];
  sources: any[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  warnings: any[];
  request: {
    body: string;
  };
  response: {
    id: string;
    timestamp: string;
    modelId: string;
    headers: Record<string, string>;
    messages: {
      role: string;
      content: Array<{
        type: string;
        text?: string;
        toolCallId?: string;
        toolName?: string;
        args?: Record<string, any>;
      }>;
      id: string;
    }[];
  };
  providerMetadata: Record<string, any>;
  experimental_providerMetadata: Record<string, any>;
  isContinued: boolean;
}

export default async function DebugPage() {
  // Check authorization
  if (!isMax()) {
    redirect('/')
  }

  // Get all log keys
  const logKeys = await redis.keys('logs:*')
  
  // Sort keys by timestamp (descending order)
  const sortedKeys = logKeys.sort((a, b) => {
    const aTimestamp = parseInt(a.split(':')[1])
    const bTimestamp = parseInt(b.split(':')[1])
    return bTimestamp - aTimestamp // Descending order
  })
  
  // Fetch logs for each key
  const conversations = await Promise.all(
    sortedKeys.map(async (key) => {
      const logs: Array<LogStep> = await redis.lrange(key, 0, -1)
      const timestamp = parseInt(key.split(':')[1])
      const date = new Date(timestamp)
      
      return {
        id: key,
        timestamp,
        date,
        logs,
      }
    })
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Calendar Assistant Debug Logs</h1>
      
      {conversations.length === 0 ? (
        <p>No conversations found</p>
      ) : (
        <div className="space-y-12">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold">
                  Conversation from {conversation.date.toLocaleString()}
                </h2>
                <span className="text-sm text-gray-500">
                  ID: {conversation.id}
                </span>
              </div>
              
              {(() => {
                // Find the first log step which should have the full conversation history
                const firstLog = conversation.logs[0];
                let parsedFirstLog: LogStep;
                
                try {
                  parsedFirstLog = typeof firstLog === 'string' ? JSON.parse(firstLog) : firstLog;
                } catch (e) {
                  // If parsing fails, render a fallback message
                  return <div className="p-3 bg-gray-50 rounded">Failed to parse conversation data</div>;
                }
                
                // Try to extract the full conversation from request.body if it exists
                let fullConversation: any[] = [];
                if (parsedFirstLog.request?.body) {
                  try {
                    const requestBody = JSON.parse(parsedFirstLog.request.body);
                    if (requestBody.messages && Array.isArray(requestBody.messages)) {
                      fullConversation = requestBody.messages;
                    }
                  } catch (e) {
                    console.error("Failed to parse request body", e);
                  }
                }
                
                // If we couldn't get conversation from request.body, use the traditional approach
                if (fullConversation.length === 0) {
                  return (
                    <div className="space-y-3">
                      {conversation.logs.map((log, index) => {
                        // Parse the log if it's a string
                        let parsedLog: LogStep;
                        try {
                          parsedLog = typeof log === 'string' ? JSON.parse(log) : log;
                        } catch (e) {
                          // If parsing fails, just use the raw string
                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                              <pre className="whitespace-pre-wrap text-sm">{typeof log === 'string' ? log : JSON.stringify(log, null, 2)}</pre>
                            </div>
                          );
                        }
                        
                        // Render the log entry
                        return (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <details>
                              <summary className="cursor-pointer font-medium mb-2">
                                {parsedLog.stepType || 'Log Entry'} {parsedLog.text ? `- ${parsedLog.text.substring(0, 50)}...` : ''}
                              </summary>
                              <div className="space-y-3">
                                {/* Display the log content as before */}
                                <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                                  {JSON.stringify(parsedLog, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                // Get all tool calls and results from log steps
                const toolCalls: ToolCall[] = [];
                const toolResults: ToolResult[] = [];
                
                conversation.logs.forEach(log => {
                  try {
                    const parsedLog = typeof log === 'string' ? JSON.parse(log) : log;
                    if (parsedLog.toolCalls && parsedLog.toolCalls.length > 0) {
                      toolCalls.push(...parsedLog.toolCalls);
                    }
                    if (parsedLog.toolResults && parsedLog.toolResults.length > 0) {
                      toolResults.push(...parsedLog.toolResults);
                    }
                  } catch (e) {
                    // Skip if parsing fails
                  }
                });
                
                // Add final text response if available
                const lastLog = conversation.logs[conversation.logs.length - 1];
                let finalTextResponse = '';
                try {
                  const parsedLastLog = typeof lastLog === 'string' ? JSON.parse(lastLog) : lastLog;
                  if (parsedLastLog.text) {
                    finalTextResponse = parsedLastLog.text;
                  }
                } catch (e) {
                  // Skip if parsing fails
                }
                
                return (
                  <div className="space-y-4">
                    {/* Render the conversation messages */}
                    {fullConversation.map((message, index) => {
                      if (message.role === 'system') {
                        // Skip system messages as they're not part of the user-facing conversation
                        return null;
                      }
                      
                      const isUser = message.role === 'user';
                      const isAssistant = message.role === 'assistant';
                      const isTool = message.role === 'tool';
                      
                      return (
                        <div key={index} className="space-y-2">
                          {/* User message */}
                          {isUser && (
                            <div className="whitespace-pre-wrap flex justify-end">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">User</div>
                                <div>{message.content}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Assistant message */}
                          {isAssistant && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">AI</div>
                                
                                {/* Text content */}
                                {message.content && <div className="mb-2">{message.content}</div>}
                                
                                {/* Tool calls */}
                                {message.tool_calls && message.tool_calls.map((toolCall: any, toolIndex: number) => {
                                  const toolName = toolCall.function?.name;
                                  const args = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
                                  
                                  return (
                                    <div 
                                      key={`tool-${index}-${toolIndex}`}
                                      className="my-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100"
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                          <div className="text-sm text-yellow-700 dark:text-yellow-200">
                                            <span className="font-medium">{toolName}</span>
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
                                            <div>ID: {toolCall.id}</div>
                                            <div>Tool: {toolName}</div>
                                            {args && (
                                              <div>
                                                Args: <pre className="mt-1">{JSON.stringify(args, null, 2)}</pre>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </details>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Tool response */}
                          {isTool && (
                            <div className="whitespace-pre-wrap flex justify-start">
                              <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                                <div className="font-semibold mb-1 opacity-70 text-xs">Tool Result</div>
                                <div className="my-2 p-2 rounded bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      {/* Try to parse and display tool response content nicely */}
                                      {(() => {
                                        try {
                                          const result = JSON.parse(message.content);
                                          if (result.message) {
                                            return (
                                              <div className="text-sm text-green-700 dark:text-green-200">
                                                {result.message}
                                              </div>
                                            );
                                          }
                                          return (
                                            <div className="text-sm text-green-700 dark:text-green-200">
                                              Tool completed successfully
                                            </div>
                                          );
                                        } catch (e) {
                                          return (
                                            <div className="text-sm text-green-700 dark:text-green-200">
                                              {message.content}
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  <details className="mt-1">
                                    <summary className="text-xs text-green-700 dark:text-green-200 cursor-pointer hover:text-green-900 dark:hover:text-green-100">
                                      View response details
                                    </summary>
                                    <div className="mt-2 p-2 bg-green-100 dark:bg-green-800 rounded text-xs overflow-x-auto">
                                      <div className="font-mono">
                                        <div>ID: {message.tool_call_id}</div>
                                        <pre className="mt-1">{message.content}</pre>
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Display final text response if available and not already shown */}
                    {finalTextResponse && !fullConversation.some(m => 
                      m.role === 'assistant' && m.content === finalTextResponse) && (
                      <div className="whitespace-pre-wrap flex justify-start">
                        <div className="max-w-full px-4 py-2 rounded-lg shadow-sm border text-sm bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                          <div className="font-semibold mb-1 opacity-70 text-xs">AI</div>
                          <div>{finalTextResponse}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* View Raw Data button */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        View Raw Conversation Data
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                          {JSON.stringify(conversation.logs, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 