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
      const logs = await redis.lrange(key, 0, -1)
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
              
              <div className="space-y-3">
                {conversation.logs.map((log, index) => {
                  // Parse the log if it's a string
                  let parsedLog: any;
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
                      <details open>
                        <summary className="cursor-pointer font-medium mb-2">
                          {parsedLog.stepType || 'Log Entry'} {parsedLog.text ? `- ${parsedLog.text.substring(0, 50)}...` : ''}
                        </summary>
                        <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                          {JSON.stringify(parsedLog, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 