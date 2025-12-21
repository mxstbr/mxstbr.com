import z from 'zod/v3'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

type AccessTokenCache = {
  token: string
  expiresAt: number
}

const reminderTriggerSchema = z.object({
  type: z.literal('SCHEDULED_ABSOLUTE'),
  scheduledTime: z
    .string()
    .describe('ISO 8601 timestamp, e.g. 2024-12-25T15:00:00'),
  timeZoneId: z.string().describe('IANA timezone, e.g. America/Los_Angeles'),
  recurrence: z
    .object({
      freq: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
      byDay: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
      interval: z.number().int().positive().optional(),
    })
    .optional(),
})

const reminderRequestSchema = z.object({
  text: z.string().min(1, 'Reminder text is required'),
  trigger: reminderTriggerSchema,
  locale: z.string().default('en-US'),
  pushNotification: z.enum(['ENABLED', 'DISABLED']).default('ENABLED'),
})

const reminderDetailsSchema = z
  .object({
    alertToken: z.string(),
    status: z.string().optional(),
    createdTime: z.string().optional(),
    updatedTime: z.string().optional(),
    trigger: reminderTriggerSchema.partial({ type: true }),
    alertInfo: z.any().optional(),
    pushNotification: z
      .object({ status: z.enum(['ENABLED', 'DISABLED']).optional() })
      .optional(),
  })
  .passthrough()

const reminderListSchema = z.object({ alerts: z.array(reminderDetailsSchema) })

let tokenCache: AccessTokenCache | null = null

async function getAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.token
  }

  const clientId = process.env.ALEXA_CLIENT_ID
  const clientSecret = process.env.ALEXA_CLIENT_SECRET
  const refreshToken = process.env.ALEXA_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Alexa credentials (ALEXA_CLIENT_ID/SECRET/REFRESH_TOKEN)')
  }

  const tokenUrl =
    process.env.ALEXA_TOKEN_URL ?? 'https://api.amazon.com/auth/o2/token'

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Failed to exchange Alexa refresh token (${response.status}): ${
        payload.error_description || payload.error || 'unknown error'
      }`,
    )
  }

  const expiresIn = Number(payload.expires_in ?? 3600)

  tokenCache = {
    token: payload.access_token as string,
    expiresAt: Date.now() + expiresIn * 1000,
  }

  return tokenCache.token
}

async function callRemindersApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.ALEXA_API_BASE_URL ?? 'https://api.amazonalexa.com'
  const token = await getAccessToken()

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  let json: unknown

  if (text) {
    try {
      json = JSON.parse(text)
    } catch (_) {
      // ignore non-JSON bodies
    }
  }

  if (!response.ok) {
    const reason =
      (json as any)?.message || (json as any)?.error || text || 'Unknown error'
    throw new Error(`Alexa API error ${response.status}: ${reason}`)
  }

  return json as T
}

async function createReminder(payload: z.infer<typeof reminderRequestSchema>) {
  const requestBody = {
    requestTime: new Date().toISOString(),
    trigger: payload.trigger,
    alertInfo: {
      spokenInfo: {
        content: [
          {
            locale: payload.locale,
            text: payload.text,
          },
        ],
      },
    },
    pushNotification: { status: payload.pushNotification },
  }

  return callRemindersApi<z.infer<typeof reminderDetailsSchema>>(
    '/v1/alerts/reminders',
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    },
  )
}

async function updateReminder(
  reminderId: string,
  payload: z.infer<typeof reminderRequestSchema>,
) {
  const requestBody = {
    requestTime: new Date().toISOString(),
    trigger: payload.trigger,
    alertInfo: {
      spokenInfo: {
        content: [
          {
            locale: payload.locale,
            text: payload.text,
          },
        ],
      },
    },
    pushNotification: { status: payload.pushNotification },
  }

  return callRemindersApi<z.infer<typeof reminderDetailsSchema>>(
    `/v1/alerts/reminders/${reminderId}`,
    {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    },
  )
}

async function listReminders() {
  return callRemindersApi<z.infer<typeof reminderListSchema>>('/v1/alerts/reminders')
}

async function deleteReminder(reminderId: string) {
  await callRemindersApi(`/v1/alerts/reminders/${reminderId}`, {
    method: 'DELETE',
  })

  return { message: `Reminder ${reminderId} deleted` }
}

export function registerAlexaReminderTools(server: McpServer) {
  server.registerTool(
    'list_alexa_reminders',
    {
      title: 'List Alexa Reminders',
      description: 'Return all reminders visible to the Alexa skill user.',
      inputSchema: z.object({}),
      outputSchema: reminderListSchema,
      annotations: { readOnlyHint: true },
    },
    async () => {
      const reminders = await listReminders()
      return { content: [], structuredContent: reminders }
    },
  )

  server.registerTool(
    'create_alexa_reminder',
    {
      title: 'Create Alexa Reminder',
      description: 'Create a new Alexa reminder via the skill credentials.',
      inputSchema: reminderRequestSchema,
      outputSchema: reminderDetailsSchema,
    },
    async (input) => {
      const reminder = await createReminder(input)
      return { content: [], structuredContent: reminder }
    },
  )

  server.registerTool(
    'update_alexa_reminder',
    {
      title: 'Update Alexa Reminder',
      description: 'Update an existing Alexa reminder by ID.',
      inputSchema: reminderRequestSchema.extend({
        reminderId: z.string().min(1, 'reminderId is required'),
      }),
      outputSchema: reminderDetailsSchema,
    },
    async ({ reminderId, ...input }) => {
      const reminder = await updateReminder(reminderId, input)
      return { content: [], structuredContent: reminder }
    },
  )

  server.registerTool(
    'delete_alexa_reminder',
    {
      title: 'Delete Alexa Reminder',
      description: 'Delete a reminder by its Alexa reminder ID.',
      inputSchema: z.object({
        reminderId: z.string().min(1, 'reminderId is required'),
      }),
      outputSchema: z.object({ message: z.string() }),
    },
    async ({ reminderId }) => {
      const result = await deleteReminder(reminderId)
      return { content: [], structuredContent: result }
    },
  )
}
