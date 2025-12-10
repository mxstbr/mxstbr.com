import { NextResponse, type NextRequest } from 'next/server'
import { bot } from 'app/lib/telegram'
import { approveChoreViaLink, type CompletionResult } from '../../actions'
import { formatPacificDate } from '../../utils'

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
  showApproveButton,
}: {
  heading: string
  detail: string
  choreId: string
  kidId?: string | null
  targetDay?: string
  showApproveButton?: boolean
}) {
  const safeHeading = escapeHtml(heading)
  const safeDetail = escapeHtml(detail)
  const safeChoreId = escapeHtml(choreId)
  const safeKidId = kidId ? escapeHtml(kidId) : null
  const safeTargetDay = targetDay ? escapeHtml(targetDay) : null

  const button =
    showApproveButton && safeKidId
      ? `<form method="POST" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
          <input type="hidden" name="kidId" value="${safeKidId}" />
          <input type="hidden" name="day" value="${safeTargetDay ?? ''}" />
          <button type="submit" style="background: #22c55e; color: #0b1220; border: none; border-radius: 12px; padding: 12px 14px; font-weight: 700; font-size: 16px; cursor: pointer;">
            Approve this chore
          </button>
          <p class="meta">Stars are awarded only after you press approve.</p>
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
          button { transition: transform 120ms ease, box-shadow 120ms ease; box-shadow: 0 10px 40px rgba(34, 197, 94, 0.35); }
          button:hover { transform: translateY(-1px); box-shadow: 0 12px 46px rgba(34, 197, 94, 0.4); }
          button:active { transform: translateY(0); box-shadow: 0 8px 34px rgba(34, 197, 94, 0.3); }
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

const messages: Record<CompletionResult['status'], { heading: string; detail: string }> = {
  completed: {
    heading: 'Chore approved ✅',
    detail: 'Stars awarded and the board is up to date.',
  },
  skipped: {
    heading: 'Already completed',
    detail: 'No changes were made; the chore was already approved.',
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
    const body = renderPage({
      heading: 'Approval link is missing a kid',
      detail: 'We need to know which kid this chore belongs to before you can approve it.',
      choreId,
      showApproveButton: false,
    })

    return new NextResponse(body, {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }

  const body = renderPage({
    heading: 'Approve this chore',
    detail: 'Press the button below to award stars and mark the chore done.',
    choreId,
    kidId,
    targetDay,
    showApproveButton: true,
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
  { params }: { params: Promise<{ choreId: string }> },
): Promise<NextResponse> {
  const { choreId } = await params
  const formData = await request.formData()
  const kidId = formData.get('kidId')?.toString()
  const dayParam = formData.get('day')?.toString()
  const todayIso = formatPacificDate(new Date())
  const targetDay = dayParam || todayIso

  if (!kidId) {
    const body = renderPage({
      heading: 'Approval failed',
      detail: 'kidId is required to approve a chore.',
      choreId,
      showApproveButton: false,
    })

    return new NextResponse(body, {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }

  const result = await approveChoreViaLink(choreId, kidId, targetDay)

  if (result.telegramMessage) {
    const keyboard = result.undoLink
      ? { reply_markup: { inline_keyboard: [[{ text: 'Undo', url: result.undoLink }]] } }
      : undefined

    bot.telegram
      .sendMessage('-4904434425', result.telegramMessage, keyboard)
      .catch((error) => console.error('Failed to send Telegram approval confirmation', error))
  }

  const responseCopy = messages[result.status]
  const heading = responseCopy?.heading ?? 'Approval complete'
  const detail =
    result.status === 'completed'
      ? `${result.kidName ?? 'Kid'} earned +${result.awarded} stars for "${result.choreTitle ?? 'Chore'}" (${targetDay}).`
      : responseCopy?.detail ?? 'Updated the chore board.'

  const body = renderPage({ heading, detail, choreId, kidId, targetDay, showApproveButton: false })

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
