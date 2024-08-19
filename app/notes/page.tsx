import React from 'react'
import Link from 'next/link'
import { getNotes } from '../data/notes'
import { formatDate } from '../thoughts/utils'
import Prose from '../components/prose'
import Tag from 'react-feather/dist/icons/tag'
import { ItemList, ItemListItem } from '../components/item-list'
import type { Metadata } from 'next'

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
          The below is my{' '}
          <Link href="/notes/digital-garden">digital garden</Link>, my
          collection of explorations that I'm actively tending to. Some of these
          ideas are still developing; some others are more developed but simply
          too small to be a standalone <Link href="/">essay</Link>; some others
          yet I just want to remember and be able to reference.{' '}
          <mark>I only write down ideas that strongly resonate with me</mark>,{' '}
          ones that surprise me or influence my thinking in some major way.
        </p>
        <p>
          <mark>I welcome thoughts, comments, pushback, feedback</mark> on any
          of these ideas; the whole reason I publish them publicly is to be able
          to sharpen my thinking together with you. If anything here resonates
          with you, please reach out via{' '}
          <a href="mailto:contact@mxstbr.com?subject=Digital garden">email</a>{' '}
          or <a href="https://twitter.com/mxstbr">Twitter DMs</a>.
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
                  <Tag size="0.8em" className="text-slate-500" />
                  {tag.name}
                </Link>
              }
              right={`${notesCount} notes`}
            ></ItemListItem>
          )
        })}
      </ul>
      <h2 className="font-bold text-2xl">All Notes</h2>
      <ul className="space-y-6 sm:space-y-4">
        {notes
          .sort(
            (a, b) =>
              new Date(b.frontmatter.publishedAt).getTime() -
              new Date(a.frontmatter.publishedAt).getTime(),
          )
          .map((note) => (
            <li
              key={note.frontmatter.slug}
              className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:space-x-4"
            >
              <div className="w-32 font-mono shrink-0 tabular-nums text-slate-500">
                {formatDate(note.frontmatter.publishedAt)}
              </div>
              <div className="space-y-2">
                <Link href={`/notes/${note.frontmatter.slug}`}>
                  {note.frontmatter.title}
                </Link>
                {/* <div className="text-slate-500 flex flex-row gap-4 items-center">
                  {note.frontmatter.tags?.map((tag) => (
                    <span className="flex flex-row gap-1 items-center">
                      <Tag size="0.8em" className="mt-1" /> {tag.slug}
                    </span>
                  ))}
                </div> */}
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
