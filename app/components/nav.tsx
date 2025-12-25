import Image from 'next/image'
import Link from 'next/link'
import avatar from '../../public/static/images/placeholder-avatar.svg'

export const navItems = {
  '/thoughts': {
    name: 'Essays',
  },
  '/notes': {
    name: 'Notes',
  },
}

export function Navbar() {
  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between relative px-0 pb-0 fade scroll-pr-6"
      id="nav"
    >
      <Link
        href="/"
        className="transition-all hover:text-slate-800 dark:hover:text-slate-200 flex items-center relative py-1 pr-2 no-underline space-x-2 shrink-0"
      >
        <Image
          src={avatar}
          alt="avatar"
          width={24}
          height={24}
          style={{ borderRadius: 100 }}
        />
        <h1 className="font-bold">Sonjeet Paul</h1>
      </Link>
      <div className="flex flex-row space-x-0">
        {Object.entries(navItems).map(([path, { name }]) => {
          return (
            <Link
              key={path}
              href={path}
              className="transition-all text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 flex align-middle relative py-1 px-3 first:pl-0 last:pr-0 no-underline"
            >
              {name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
