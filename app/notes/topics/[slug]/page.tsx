import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Prose from '../../../components/prose'
import { getNotes } from '../../hashnode'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 60

export async function generateStaticParams() {
  return (await getNotes()).map((note) =>
    note.frontmatter.tags?.flatMap((tag) => tag.slug),
  )
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const allNotes = await getNotes()
  const tag = allNotes
    .find((note) =>
      note.frontmatter.tags?.some((tag) => tag.slug === params.slug),
    )
    ?.frontmatter.tags?.find((tag) => tag.slug === params.slug)

  return {
    title: `Notes on ${tag?.name || params.slug}`,
    description: `Notes and explorations related to ${tag?.name || params.slug}`,
  }
}

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
    <div className="space-y-10">
      <div>
        <Link
          href="/notes"
          className="flex flex-row items-center gap-2 uppercase text-sm font-bold tracking-wider no-underline hover:underline"
        >
          <ArrowLeft size="1em" /> All Topics
        </Link>
        <h1 className="my-6 text-4xl font-bold">{tag.name}</h1>
        <Prose>
          <p>Notes and explorations related to {tag.name}.</p>
        </Prose>
      </div>
      <ul>
        {notes
          .sort(
            (a, b) =>
              new Date(
                b.frontmatter.updatedAt || b.frontmatter.publishedAt,
              ).getTime() -
              new Date(
                a.frontmatter.updatedAt || a.frontmatter.publishedAt,
              ).getTime(),
          )
          .map((note) => (
            <li
              key={note.frontmatter.slug}
              className="flex flex-col space-y-2 border-b dark:border-slate-700 last:border-b-0 py-8 first:pt-0 last:pb-0"
            >
              <div className="space-y-2">
                <Link
                  href={`/notes/${note.frontmatter.slug}`}
                  className="font-medium text-lg"
                >
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
