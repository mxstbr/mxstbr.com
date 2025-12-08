'use server'

import { Resend } from 'resend'
import { Note } from '../hashnode'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function submitFeedback(formData: FormData, note: Note) {
  const thoughts = formData.get('thoughts')
  const email = formData.get('email')

  if (!thoughts?.toString().trim()) return { success: false }

  const result = await resend.emails.send({
    from: `${email?.toString().trim() || ''} <mxstbr@resend.dev>`,
    to: 'contact@mxstbr.com',
    subject: `RE: ${note.frontmatter.title}`,
    html: /* HTML */ `<html>
      <head></head>
      <body>
        ${
          /* Email preview text hack from https://stackoverflow.com/a/53416681 */ ''
        }
        <!--[if !mso]><!-->
        <span
          style="display:none !important; visiblility:hidden; opacity:0px; color:transparent; height:0px; width:0px; mso-hide:all; max-height:0px; max-width:0px; line-height:0px; overflow:hidden;"
          >${thoughts.toString().trim().slice(0, 100)}</span
        >
        <!--<![endif]-->
        <p>
          ${email || 'Somebody'} replied to
          <a href="https://mxstbr.com/notes/${note.frontmatter.slug}"
            >${note.frontmatter.title}</a
          >:
        </p>
        <blockquote
          class="gmail_quote"
          style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"
        >
          ${thoughts
            .toString()
            .trim()
            .split('\n')
            .map((line) => `<p>${line}</p>`)
            .join('\n>')}
        </blockquote>
      </body>
    </html>`,
    replyTo: email?.toString().trim() || undefined,
  })

  console.log(result)

  return { success: result.error === null }
}
