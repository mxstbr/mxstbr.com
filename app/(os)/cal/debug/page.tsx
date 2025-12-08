import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CalDebugRedirect() {
  redirect('/clippy/debug')
}
