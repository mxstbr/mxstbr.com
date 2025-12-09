import { NextResponse, type NextRequest } from 'next/server'
import { formatPacificDate } from '../../utils'
import { undoChoreViaLink } from '../../actions'

type UndoResult = Awaited<ReturnType<typeof undoChoreViaLink>>

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderPage({
  heading,
  detail,
  choreId,
  kidId,
  targetDay,
  showUndoButton,
}: {
  heading: string
  detail: string
  choreId: string
  kidId?: string | null
  targetDay?: string
  showUndoButton?: boolean
}) {
  const safeHeading = escapeHtml(heading)
  const safeDetail = escapeHtml(detail)
  const safeChoreId = escapeHtml(choreId)
  const safeKidId = kidId ? escapeHtml(kidId) : null
  const safeTargetDay = targetDay ? escapeHtml(targetDay) : null

  const button =
    showUndoButton && safeKidId
      ? `<form method="POST" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
          <input type="hidden" name="kidId" value="${safeKidId}" />
          <input type="hidden" name="day" value="${safeTargetDay ?? ''}" />
          <button type="submit" style="background: #f97316; color: #0b1220; border: none; border-radius: 12px; padding: 12px 14px; font-weight: 700; font-size: 16px; cursor: pointer;">
            Undo this completion
          </button>
          <p class="meta">Stars are removed after you press undo.</p>
        </form>`
      : ''

  return `<!doctype html>
    <html>
      <head>
        <title>${safeHeading}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; }
          .card { background: #0b1220; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; max-width: 480px; box-shadow: 0 15px 60px rgba(0,0,0,0.4); }
          h1 { margin: 0 0 12px; font-size: 20px; }
          p { margin: 0; line-height: 1.5; font-size: 16px; color: #cbd5e1; }
          .meta { margin-top: 12px; font-size: 13px; color: #94a3b8; }
          button { transition: transform 120ms ease, box-shadow 120ms ease; box-shadow: 0 10px 40px rgba(249, 115, 22, 0.35); }
          button:hover { transform: translateY(-1px); box-shadow: 0 12px 46px rgba(249, 115, 22, 0.4); }
          button:active { transform: translateY(0); box-shadow: 0 8px 34px rgba(249, 115, 22, 0.3); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${safeHeading}</h1>
          <p>${safeDetail}</p>
          <p class="meta">Chore ID: ${safeChoreId}</p>
          ${safeKidId ? `<p class="meta">Kid ID: ${safeKidId}</p>` : ''}
          ${safeTargetDay ? `<p class="meta">Target day: ${safeTargetDay}</p>` : ''}
          ${button}
        </div>
      </body>
    </html>`
}

const messages: Record<UndoResult['status'], { heading: string; detail: string }> = {
  undone: {
    heading: 'Chore undone ⏪',
    detail: 'Stars removed and the board is up to date.',
  },
  not_found: {
    heading: 'Nothing to undo',
    detail: 'No matching completion was found for this chore.',
  },
  invalid: {
    heading: 'Undo failed',
    detail: 'We could not find that chore or kid. Please try again.',
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ completionId: string }> },
): Promise<NextResponse> {
  const { completionId } = await params
  const url = new URL(request.url)
  const choreId = url.searchParams.get('choreId')
  const kidId = url.searchParams.get('kidId')
  const dayParam = url.searchParams.get('day')
  const todayIso = formatPacificDate(new Date())
  const targetDay = dayParam || todayIso

  if (!kidId || !choreId) {
    const body = renderPage({
      heading: 'Undo link is missing info',
      detail: 'We need both the kid and chore ID to undo this completion.',
      choreId: choreId ?? completionId,
      showUndoButton: false,
    })

    return new NextResponse(body, {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }

  const body = renderPage({
    heading: 'Undo this completion',
    detail: 'Press the button below to remove the stars and reopen the chore.',
    choreId,
    kidId,
    targetDay,
    showUndoButton: true,
  })

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ completionId: string }> },
): Promise<NextResponse> {
  const { completionId } = await params
  const formData = await request.formData()
  const kidId = formData.get('kidId')?.toString()
  const dayParam = formData.get('day')?.toString()
  const url = new URL(request.url)
  const choreId = url.searchParams.get('choreId')
  const todayIso = formatPacificDate(new Date())
  const targetDay = dayParam || url.searchParams.get('day') || todayIso

  if (!kidId || !choreId) {
    const body = renderPage({
      heading: 'Undo failed',
      detail: 'kidId and choreId are required to undo a chore.',
      choreId: choreId ?? completionId,
      showUndoButton: false,
    })

    return new NextResponse(body, {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }

  const result = await undoChoreViaLink({ choreId, kidId, completionId, targetDay })
  const responseCopy = messages[result.status]
  const heading = responseCopy?.heading ?? 'Undo complete'
  const detail =
    result.status === 'undone'
      ? `${result.kidName ?? 'Kid'} lost ${Math.abs(result.delta)} stars for "${result.choreTitle ?? 'Chore'}" (${targetDay}).`
      : responseCopy?.detail ?? 'Updated the chore board.'

  const body = renderPage({ heading, detail, choreId, kidId, targetDay, showUndoButton: false })

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
