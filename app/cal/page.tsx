import React from 'react'
import { redirect } from 'next/navigation'

import Year from './Year'
import { events as madisonEvents } from './madison'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function isMadison(orgId: string) {
  if (process.env.NODE_ENV === 'development')
    return orgId === 'org_2RxESyA4xrCUKPz3Ky1sK8u2NqQ'
  return orgId === 'org_2S11pLk6UvRphZIrCkZfdxKd06R'
}

async function getEvents(orgId: string) {
  if (isMadison(orgId)) return madisonEvents

  return []
}

export default async function Plan() {
  // const { userId, orgId } = auth();
  // if (!userId) redirect("/sign-in");
  // if (!orgId) redirect("/create-organization");

  const events = await getEvents('org_2RxESyA4xrCUKPz3Ky1sK8u2NqQ')

  return (
    <div>
      <Year events={events} />
    </div>
  )
}
