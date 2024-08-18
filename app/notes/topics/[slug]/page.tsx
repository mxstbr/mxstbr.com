import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Prose from '../../../components/prose'
import { getNotes } from '../../../data/notes'
import { formatDate } from '../../../thoughts/utils'

export default async function Page({ params }) {
  const allNotes = await getNotes()
  const notes = allNotes.filter((note) =>
    note.frontmatter.tags?.some((tag) => tag.slug === params.slug),
  )
  const tag = allNotes
    .find((note) =>
      note.frontmatter.tags?.some((tag) => tag.slug === params.slug),
    )
    ?.frontmatter.tags?.find((tag) => tag.slug === params.slug)

  if (!tag) return notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/notes"
          className="flex flex-row items-center gap-2 uppercase text-sm font-bold tracking-wider no-underline hover:underline"
        >
          <ArrowLeft size="1em" /> All Notes
        </Link>
        <h1 className="my-6 text-4xl font-bold">{tag.name}</h1>
        <Prose>
          <p>Notes and explorations related to {tag.name}.</p>
        </Prose>
      </div>
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
              <div className="space-y-1">
                <Link href={`/notes/${note.frontmatter.slug}`}>
                  {note.frontmatter.title}
                </Link>
                <p className="text-slate-500">{note.frontmatter.summary}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
