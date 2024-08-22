'use server'

export async function submitFeedback(formData: FormData, noteSlug: string) {
  const thoughts = formData.get('thoughts')
  const email = formData.get('email')

  if (!thoughts?.toString().trim()) return { success: false }

  const result = await sendTelegramMessage(
    `<em>${email || 'Somebody'} replied to <a href="https://mxstbr.com/notes/${noteSlug}">${noteSlug}</a>:</em>\n<blockquote>${thoughts.toString().trim()}</blockquote>`,
  )

  return { success: result }
}

async function sendTelegramMessage(text: string) {
  console.log(text)
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
        parse_mode: 'HTML',
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
