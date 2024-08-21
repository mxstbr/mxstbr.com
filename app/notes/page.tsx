import React from 'react'
import Link from 'next/link'
import { getNotes } from '../data/notes'
import { formatDate } from '../thoughts/utils'
import Prose from '../components/prose'
import Tag from 'react-feather/dist/icons/tag'
import { ItemList, ItemListItem } from '../components/item-list'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 60

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

  const allTags = notes.flatMap((note) => note.frontmatter.tags)
  const tags = [
    // @ts-ignore
    ...new Map(allTags.map((tag) => [tag.slug, tag])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-12">
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
          So,{' '}
          <mark>
            if any of these ideas tickle your brain in some way, I want to hear
            about it
          </mark>
          ! That kind of conversation is exactly why I{' '}
          <Link href="/notes/digital-garden#why-publish-it-publicly">
            default to open
          </Link>{' '}
          with these notes. Contact me via{' '}
          <a href="mailto:contact@mxstbr.com?subject=Digital garden">email</a>{' '}
          or <a href="https://x.com/mxstbr">Twitter/X DMs</a>.
        </p>
      </Prose>
      <h2 className="font-bold text-2xl">By Topic</h2>
      <ul className="pl-0 grid sm:grid-cols-2 gap-x-8 gap-y-6">
        {tags.map((tag) => {
          const notesCount = notes.filter((note) =>
            note.frontmatter.tags?.find((t) => t.slug === tag.slug),
          ).length
          return (
            <ItemListItem
              key={tag.slug}
              left={
                <Link
                  href={`/notes/topics/${tag.slug}`}
                  className="flex flex-row gap-1 items-center"
                >
                  <Tag size="0.8em" className="opacity-75 text-slate-500" />
                  {tag.name}
                </Link>
              }
              right={`${notesCount} notes`}
            ></ItemListItem>
          )
        })}
      </ul>
      <h2 className="font-bold text-2xl">All Notes</h2>
      <ul className="space-y-8 sm:space-y-6">
        {notes
          // Filter out pure templates (but not notes that also include templates)
          .filter(
            (note) =>
              note.frontmatter.tags?.length !== 1 ||
              note.frontmatter.tags[0].slug !== 'templates',
          )
          .sort(
            (a, b) =>
              new Date(b.frontmatter.publishedAt).getTime() -
              new Date(a.frontmatter.publishedAt).getTime(),
          )
          .map((note) => (
            <li
              key={note.frontmatter.slug}
              className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6"
            >
              <div className="text-sm sm:text-base font-mono tracking-tight shrink-0 tabular-nums text-slate-500">
                {formatDate(note.frontmatter.publishedAt)}
              </div>
              <div className="space-y-2">
                <Link
                  href={`/notes/${note.frontmatter.slug}`}
                  className="font-medium"
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
