import LinkedIn from 'react-feather/dist/icons/linkedin'
import Instagram from 'react-feather/dist/icons/instagram'
import GitHub from 'react-feather/dist/icons/github'
import Twitter from 'react-feather/dist/icons/twitter'
import RSS from 'react-feather/dist/icons/rss'

export default function Footer() {
  return (
    <footer className="w-full mx-auto py-12 border dark:border-slate-700 border-x-0 border-b-0">
      <ul className="font-sm w-full grid grid-cols-2 xs:flex xs:flex-row justify-between gap-y-4 xs:gap-y-0 xs:gap-x-4 text-slate-600 dark:text-slate-300">
        <li>
          <a
            className="flex items-center transition-all hover:text-slate-800 dark:hover:text-slate-100 no-underline"
            rel="noopener noreferrer"
            target="_blank"
            href="/rss"
          >
            <RSS size={16} />
            <p className="ml-2">RSS</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-slate-800 dark:hover:text-slate-100 no-underline"
            rel="noopener noreferrer"
            target="_blank"
            href="https://twitter.com/mxstbr"
          >
            <Twitter size={16} />
            <p className="ml-2">Twitter</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-slate-800 dark:hover:text-slate-100 no-underline"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/mxstbr"
          >
            <GitHub size={16} />
            <p className="ml-2">GitHub</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-slate-800 dark:hover:text-slate-100 no-underline"
            rel="noopener noreferrer"
            target="_blank"
            href="https://linkedin.com/in/mxstbr"
          >
            <LinkedIn size={16} />
            <p className="ml-2">LinkedIn</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-slate-800 dark:hover:text-slate-100 no-underline"
            rel="noopener noreferrer"
            target="_blank"
            href="https://instagram.com/mxstbr"
          >
            <Instagram size={16} />
            <p className="ml-2">Instagram</p>
          </a>
        </li>
      </ul>
    </footer>
  )
}
