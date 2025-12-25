import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArrowLeft from 'react-feather/dist/icons/arrow-left'
import Prose from '../../../../components/prose'
import { getNotes } from '../../utils'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 60

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const tags = (await getNotes()).flatMap(
    (note) => note.metadata.tags?.map((tag) => tag.slug) ?? [],
  )

  return Array.from(new Set(tags)).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const allNotes = await getNotes()
  const tag = allNotes
    .find((note) =>
      note.metadata.tags?.some((tag) => tag.slug === slug),
    )
    ?.metadata.tags?.find((tag) => tag.slug === slug)

  return {
    title: `Notes on ${tag?.name || slug}`,
    description: `Notes and explorations related to ${tag?.name || slug}`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const allNotes = await getNotes()
  const notes = allNotes.filter((note) =>
    note.metadata.tags?.some((tag) => tag.slug === slug),
  )
  const tag = allNotes
    .find((note) =>
      note.metadata.tags?.some((tag) => tag.slug === slug),
    )
    ?.metadata.tags?.find((tag) => tag.slug === slug)

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
                b.metadata.updatedAt || b.metadata.publishedAt,
              ).getTime() -
              new Date(
                a.metadata.updatedAt || a.metadata.publishedAt,
              ).getTime(),
          )
          .map((note) => (
            <li
              key={note.slug}
              className="flex flex-col space-y-2 border-b dark:border-slate-700 last:border-b-0 py-8 first:pt-0 last:pb-0"
            >
              <div className="space-y-2">
                <Link
                  href={`/notes/${note.slug}`}
                  className="font-medium text-lg"
                >
                  {note.metadata.title}
                </Link>
                <p className="text-slate-500">{note.metadata.summary}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
