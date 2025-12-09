import { NextResponse, type NextRequest } from 'next/server'
import { approveChoreViaLink, type CompletionResult } from '../../actions'
import { formatPacificDate } from '../../utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ choreId: string }> },
): Promise<NextResponse> {
  const { choreId } = await params
  const url = new URL(request.url)
  const kidId = url.searchParams.get('kidId')
  const dayParam = url.searchParams.get('day')
  const todayIso = formatPacificDate(new Date())
  const targetDay = dayParam || todayIso

  if (!kidId) {
    return NextResponse.json({ error: 'kidId is required' }, { status: 400 })
  }

  const result = await approveChoreViaLink(choreId, kidId, targetDay)
  const choreTitle = result.choreTitle ?? 'Chore'
  const kidName = result.kidName ?? 'Kid'

  const messages: Record<CompletionResult['status'], { heading: string; detail: string }> = {
    completed: {
      heading: 'Chore approved ✅',
      detail: `${kidName} earned +${result.awarded} stars for "${choreTitle}" (${targetDay}).`,
    },
    skipped: {
      heading: 'Already completed',
      detail: `No changes were made; "${choreTitle}" is already done for ${targetDay}.`,
    },
    invalid: {
      heading: 'Approval failed',
      detail: 'We could not find that chore or kid. Please try again.',
    },
    unauthorized: {
      heading: 'Approval failed',
      detail: 'We could not find that chore or kid. Please try again.',
    },
  }

  const responseCopy = messages[result.status]
  const heading = responseCopy?.heading ?? 'Approval complete'
  const detail = responseCopy?.detail ?? 'Updated the chore board.'

  const body = `<!doctype html>
    <html>
      <head>
        <title>${heading}</title>
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; }
          .card { background: #0b1220; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; max-width: 480px; box-shadow: 0 15px 60px rgba(0,0,0,0.4); }
          h1 { margin: 0 0 12px; font-size: 20px; }
          p { margin: 0; line-height: 1.5; font-size: 16px; color: #cbd5e1; }
          .meta { margin-top: 12px; font-size: 13px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class=\"card\">
          <h1>${heading}</h1>
          <p>${detail}</p>
          <p class=\"meta\">Chore ID: ${choreId}</p>
        </div>
      </body>
    </html>`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
