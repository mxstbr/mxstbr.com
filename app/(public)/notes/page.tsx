import React from 'react'
import Link from 'next/link'
import { EMOJI_FOR_STATUS, Note, getNotes } from './utils'
import Prose from '../../components/prose'
import Tag from 'react-feather/dist/icons/tag'
import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Notes',
  description:
    "My digital garden, my collection of notes and explorations that I'm actively tending to.",
  openGraph: {
    title: 'Notes',
    description:
      "My digital garden, my collection of notes and explorations that I'm actively tending to.",
    images: ['https://mxstbr.com/static/images/digital-garden.jpeg'],
  },
  twitter: {
    title: 'Notes',
    description:
      "My digital garden, my collection of notes and explorations that I'm actively tending to.",
    images: ['https://mxstbr.com/static/images/digital-garden.jpeg'],
  },
}

export default async function WritingPage() {
  const notes = await getNotes()

  const allTags = notes.flatMap((note) => note.metadata.tags || [])
  const tags = [
    // @ts-ignore
    ...new Map(allTags.map((tag) => [tag.slug, tag])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-16 lg:space-y-20">
      <Prose>
        <h1>Notes</h1>
        <p>
          This is my <Link href="/notes/digital-garden">digital garden</Link>{' '}
          where I cultivate my ideas. I share these explorations early, so{' '}
          <mark>don't expect polished thoughts.</mark> (you can find those in{' '}
          <Link href="/">my essays</Link>) If an idea is in this digital garden,
          then it's an idea that tickled my brain in some significant way,
          something that surprised or influenced me, that I want to explore
          further.
        </p>
        <p>
          <mark>
            If any of these ideas tickle your brain in some way, I want to hear
            about it
          </mark>
          . That kind of conversation is exactly why I{' '}
          <Link href="/notes/digital-garden#why-publish-it-publicly">
            default to open
          </Link>{' '}
          with these notes! Contact me via{' '}
          <a href="mailto:contact@mxstbr.com?subject=Digital garden">email</a>{' '}
          or <a href="https://x.com/mxstbr">Twitter/X DMs</a>.
        </p>
        <p>
          <em>
            <Link href="/notes/digital-garden#denoting-the-maturity-of-my-explorations">
              Legend
            </Link>
            : 🌱 = Seedling, 🌿 = Budding, 🌲 = Evergreen, 🔗 = Link
          </em>
        </p>
      </Prose>

      <div className="lg:px-12 lg:w-screen lg:relative lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:overflow-hidden">
        <div className="lg:max-w-screen-xl mx-auto columns-xs gap-8 space-y-8">
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
              <NoteCard key={note.slug} note={note} />
            ))}
        </div>
      </div>
    </div>
  )
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="flex gap-x-4 border rounded-md p-4 break-inside-avoid">
      <div className="text-2xl">
        {EMOJI_FOR_STATUS[note.metadata.status]}
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href={`/notes/${note.slug}`}
          className="font-medium text-lg hover:underline"
        >
          {note.metadata.title}
        </Link>
        <div className="flex flex-wrap gap-2 text-slate-500">
          {note.metadata.tags?.map((tag) => (
            <Link
              key={tag.slug}
              href={`/notes/topics/${tag.slug}`}
              className="text-sm flex flex-row gap-1 items-center no-underline hover:underline"
            >
              <Tag size="0.8em" className="opacity-75 text-slate-500" />
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
