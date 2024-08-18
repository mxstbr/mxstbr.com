import React from 'react'
import Link from 'next/link'
import { getNotes } from '../data/notes'
import { formatDate } from '../thoughts/utils'
import Prose from '../components/prose'

export default async function WritingPage() {
  const notes = await getNotes()

  return (
    <div className="space-y-12">
      <Prose>
        <h2>Notes</h2>
        <p>
          The below is my{' '}
          <Link href="/notes/digital-garden">digital garden</Link>, my
          collection of links, notes and explorations that I'm actively tending
          to. They're either still budding or they're too small as a standalone
          essay. For my evergreen, refined thoughts check out my{' '}
          <Link href="/">essays</Link>.
        </p>
      </Prose>
      <ul className="space-y-4">
        {notes
          .sort(
            (a, b) =>
              new Date(b.frontmatter.publishedAt).getTime() -
              new Date(a.frontmatter.publishedAt).getTime(),
          )
          .map((note) => (
            <li key={note.frontmatter.slug} className="flex flex-row space-x-4">
              <div className="w-32 font-mono shrink-0 tabular-nums text-slate-500">
                {formatDate(note.frontmatter.publishedAt)}
              </div>
              <div className="space-y-2">
                <Link href={`/notes/${note.frontmatter.slug}`}>
                  {note.frontmatter.title}
                </Link>
                {/* <p className="text-slate-500">{note.frontmatter.summary}</p> */}
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
