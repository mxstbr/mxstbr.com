import { verifyBasicAuth } from 'app/auth'
import { NextRequest, NextResponse } from 'next/server'
import { clippyGenerateText } from '../../lib/clippy-agent'
import { dedent } from '../../lib/dedent'

export async function POST(req: NextRequest) {
  const authed = verifyBasicAuth(req)
  if (!authed) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body: NormalisedJsonHashEmailMessage = await req.json()

  // Call the calendar assistant with the email plaintext
  try {
    const result = await clippyGenerateText({
      messages: [
        {
          role: 'user',
          content: dedent`
            This email was forwarded to you.

            <email>
            <from>${body.headers.from}</from>
            <to>${body.headers.to}</to>
            <subject>${body.headers.subject}</subject>
            <content>
            ${body.plain}
            </content>
            </email>
            `,
        },
      ],
    })
    // We don't need to send a response back to the email sender,
    // the agent will take care of creating/updating/deleting events
    return new NextResponse(JSON.stringify(result, null, 2), { status: 200 })
  } catch (error) {
    console.error('Error processing email with calendar assistant:', error)
    return new NextResponse('Error processing email', { status: 500 })
  }
}

// Normalised JSON Hash Email Message Format

// SPF Result type
type SPFResult = {
  result:
    | 'pass'
    | 'fail'
    | 'neutral'
    | 'softfail'
    | 'none'
    | 'temperror'
    | 'permerror'
  domain: string
}

// Envelope type
type Envelope = {
  to: string
  from: string
  helo_domain: string
  remote_ip: string
  recipients: string[]
  spf?: SPFResult
  tls: boolean
}

// Headers type - using Record with string keys and flexible values
type Headers = {
  return_path?: string
  received?: string[] | string
  date?: string
  from?: string
  to?: string
  message_id?: string
  subject?: string
  mime_version?: string
  content_type?: string
  delivered_to?: string
  received_spf?: string
  authentication_results?: string
  user_agent?: string
  [key: string]: string | string[] | undefined // Allow for any other headers
}

// Base Attachment type with common properties
interface BaseAttachment {
  file_name: string
  content_type: string
  size: number
  disposition: 'attachment' | 'inline'
  content_id?: string
}

// URL Attachment type
interface UrlAttachment extends BaseAttachment {
  url: string
  content?: never // Ensure content is not present when url is used
}

// Embedded Attachment type
interface EmbeddedAttachment extends BaseAttachment {
  content: string // Base64 encoded content
  url?: never // Ensure url is not present when content is used
}

// Union type for attachments
type Attachment = UrlAttachment | EmbeddedAttachment

// Main Email Message type
type NormalisedJsonHashEmailMessage = {
  envelope: Envelope
  headers: Headers
  plain: string
  html?: string
  reply_plain?: string
  attachments: Attachment[]
}
