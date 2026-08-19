import type { Metadata } from 'next'
import Link from 'next/link'
import { getBlogPosts } from 'app/(public)/thoughts/utils'

export const metadata: Metadata = {
  title: 'Essays',
  description: 'Essays by Max Stoiber.',
}

export default function Essays() {
  const essays = getBlogPosts()

  return (
    <article className="plain-page">
      <h1>Essays</h1>
      <ul>
        {essays.map((essay) => (
          <li key={essay.slug}>
            <Link href={`/thoughts/${essay.slug}`}>{essay.metadata.title}</Link>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/">Max Stoiber</Link>
      </p>
    </article>
  )
}
