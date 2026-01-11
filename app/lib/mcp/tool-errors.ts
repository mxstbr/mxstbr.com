import z from 'zod/v3'

type ToolErrorPayload = {
  tool: string
  message: string
  name: string
  stack?: string
  input?: unknown
  validationErrors?: Array<{
    path: string
    message: string
    code: string
    details?: Record<string, unknown>
  }>
}

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>
  structuredContent: { error: ToolErrorPayload }
  isError: true
}

const hasIssues = (
  error: unknown,
): error is { issues: z.ZodIssue[]; name?: string; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'issues' in error &&
  Array.isArray((error as { issues?: unknown }).issues)

const formatIssuePath = (path: Array<string | number>) =>
  path.length ? path.map((segment) => segment.toString()).join('.') : '(root)'

const formatIssueDetails = (issue: z.ZodIssue) => {
  const { path, message, code, ...rest } = issue
  const details =
    Object.keys(rest).length > 0 ? (rest as Record<string, unknown>) : undefined

  return {
    path: formatIssuePath(path),
    message,
    code,
    details,
  }
}

export const buildToolErrorResponse = (
  toolName: string,
  error: unknown,
  input?: unknown,
): ToolResponse => {
  const defaultMessage =
    typeof error === 'string' ? error : 'Unexpected error while running tool.'
  const baseMessage =
    error instanceof Error ? error.message || defaultMessage : defaultMessage
  const errorName =
    error instanceof Error
      ? error.name
      : typeof error === 'object' && error && 'name' in error
        ? String((error as { name?: unknown }).name)
        : 'UnknownError'

  const validationErrors = hasIssues(error)
    ? error.issues.map(formatIssueDetails)
    : undefined

  const validationText = validationErrors?.length
    ? `Validation failed with ${validationErrors.length} issue${
        validationErrors.length === 1 ? '' : 's'
      }:\n${validationErrors
        .map(
          (issue, index) =>
            `${index + 1}. ${issue.path}: ${issue.message} (code: ${issue.code}${
              issue.details ? `, details: ${JSON.stringify(issue.details)}` : ''
            })`,
        )
        .join('\n')}`
    : undefined

  const message = validationText
    ? `Tool "${toolName}" rejected the request. ${validationText}`
    : `Tool "${toolName}" failed: ${baseMessage}`

  return {
    content: [{ type: 'text', text: message }],
    structuredContent: {
      error: {
        tool: toolName,
        message: baseMessage,
        name: errorName,
        stack: error instanceof Error ? error.stack : undefined,
        input,
        validationErrors,
      },
    },
    isError: true,
  }
}

export const withToolErrorHandling =
  <Input, Output>(
    toolName: string,
    handler: (input: Input) => Promise<Output>,
  ) =>
  async (input: Input) => {
    try {
      return await handler(input)
    } catch (error) {
      return buildToolErrorResponse(toolName, error, input)
    }
  }
