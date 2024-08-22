'use server'

export async function submitFeedback(formData: FormData, noteSlug: string) {
  const thoughts = formData.get('thoughts')
  const email = formData.get('email')

  if (!thoughts?.toString().trim()) return { success: false }

  const result = await sendTelegramMessage(
    `_${email ? escapeForTelegram(email.toString()) : 'Somebody'} replied to [${escapeForTelegram(noteSlug)}](https://mxstbr.com/notes/${escapeForTelegram(noteSlug)}):_\n>${thoughts
      .toString()
      .trim()
      .split('\n')
      .map((line) => escapeForTelegram(line))
      .join('\n>')}`,
  )

  return { success: result }
}

// Escape special chars; from https://stackoverflow.com/questions/40626896/telegram-does-not-escape-some-markdown-characters#comment132933479_71313944
function escapeForTelegram(string: string) {
  return string.replace(/([|{\[\]*_~}+)`(#>!=\-.])/gm, '\\$1')
}

async function sendTelegramMessage(text: string) {
  return await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: '1010154965',
        text,
        parse_mode: 'MarkdownV2',
        link_preview_options: {
          is_disabled: true,
        },
      }),
    },
  ).then(async (res) => {
    if (!res.ok) console.log(await res.json())

    return res.ok
  })
}
