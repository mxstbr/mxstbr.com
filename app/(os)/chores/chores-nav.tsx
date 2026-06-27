import Link from 'next/link'

type ChoresView = 'chores' | 'rewards' | 'packing'

type ChoresNavProps = {
  current: ChoresView
  osParam?: string
}

const views: { id: ChoresView; label: string; path: string }[] = [
  { id: 'chores', label: 'Chores', path: '/chores' },
  { id: 'rewards', label: 'Rewards', path: '/chores/rewards' },
  { id: 'packing', label: 'Packing', path: '/chores/packing' },
]

export function choresViewHref(path: string, osParam?: string) {
  const params = new URLSearchParams()
  if (osParam) params.set('os', osParam)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export function ChoresNav({ current, osParam }: ChoresNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-slate-100/95 px-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="grid grid-cols-3 divide-x divide-slate-300 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:divide-slate-700 dark:text-slate-200">
        {views.map((view) => {
          const active = current === view.id
          return (
            <Link
              key={view.id}
              href={choresViewHref(view.path, osParam)}
              className={`flex h-11 items-center justify-center transition hover:text-slate-900 dark:hover:text-white ${
                active ? 'text-slate-900 dark:text-white' : ''
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {view.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
