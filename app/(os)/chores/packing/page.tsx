import type { Metadata } from 'next'
import { PasswordForm } from '../../components/password-form'
import { auth, isMax } from 'app/auth'
import { ChoresNav } from '../chores-nav'
import { getChoreState } from '../data'
import { ChoresErrorBoundary } from '../error-boundary'
import { CampingPackingChecklist } from '../packing-checklist'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Camping Packing',
  description: 'Kid-facing camping packing checklist.',
}

type PackingPageProps = {
  searchParams?: Promise<{
    os?: string
    pwd?: string
  }>
}

export default async function PackingPage({ searchParams }: PackingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const password = await auth()
  const isAuthorized = await isMax()

  if (!isAuthorized) {
    return (
      <PasswordForm
        error={password ? 'Invalid password.' : undefined}
        defaultPassword={resolvedSearchParams?.pwd}
      />
    )
  }

  const state = await getChoreState()
  const osParam = resolvedSearchParams?.os

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 pb-20 dark:bg-slate-900 md:h-screen md:overflow-y-hidden md:pb-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Camping trip
          </p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
            Packing Checklist
          </h1>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Check each item as you pack it.
        </p>
      </div>
      <div className="pb-16 md:min-h-0 md:flex-1 md:pb-12">
        <ChoresErrorBoundary label="the packing checklist">
          <CampingPackingChecklist kids={state.kids} />
        </ChoresErrorBoundary>
      </div>
      <ChoresErrorBoundary label="the navigation bar">
        <ChoresNav current="packing" osParam={osParam} />
      </ChoresErrorBoundary>
    </div>
  )
}
