import Link from 'next/link'
import LogoWrapper from './logo-wrapper'

const navItems = {
  '/oss': {
    name: 'open source',
  },
  '/investing': {
    name: 'investments',
  },
}

export function Navbar() {
  return (
    <aside className="-ml-3">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-start justify-between relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <Link
            href="/"
            className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1 no-underline"
          >
            <h1 className="font-bold">mxstbr</h1>
          </Link>
          <div className="flex flex-row space-x-0 -mr-3">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-3 no-underline"
                >
                  {name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
