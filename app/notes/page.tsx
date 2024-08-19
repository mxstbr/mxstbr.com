import React from 'react'
import Link from 'next/link'
import { getNotes } from '../data/notes'
import { formatDate } from '../thoughts/utils'
import Prose from '../components/prose'
import Tag from 'react-feather/dist/icons/tag'
import { ItemList, ItemListItem } from '../components/item-list'

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
          collection of notes and explorations that I'm actively tending to.
          They might still budding or simply be too small for a standalone
          essay. For my refined thoughts check out my evergreen{' '}
          <Link href="/">essays</Link>.
        </p>
      </Prose>
      <h2 className="font-bold text-2xl">By Topic</h2>
      <ul className="pl-0 grid grid-cols-2 gap-x-8 gap-y-6">
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
