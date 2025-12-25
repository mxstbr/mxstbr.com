import LinkedIn from 'react-feather/dist/icons/linkedin'
import Instagram from 'react-feather/dist/icons/instagram'
import GitHub from 'react-feather/dist/icons/github'
import Twitter from 'react-feather/dist/icons/twitter'
import RSS from 'react-feather/dist/icons/rss'

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
            href="https://twitter.com/yourhandle"
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
            href="https://github.com/yourhandle"
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
            href="https://linkedin.com/in/yourhandle"
          >
            <LinkedIn size={16} />
            <p className="ml-2">LinkedIn</p>
          </a>
        </li>
      </ul>
    </footer>
  )
}
