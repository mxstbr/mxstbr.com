import React from 'react'
import { getBlogPosts } from '../thoughts/utils'
import { getNotes } from '../notes/hashnode'
import { isMax } from 'app/auth'
import { notFound } from 'next/navigation'
import Prose from 'app/components/prose'
import { ItemList, ItemListItem } from 'app/components/item-list'

export default async function StatsPage() {
  if (!isMax()) return notFound()

  const essays = getBlogPosts({ archived: true })
  const notes = await getNotes()

  const allContent = [
    ...essays.map((essay) => ({
      title: essay.metadata.title,
      views: essay.metadata.views,
      type: 'Essay',
      url: `/thoughts/${essay.slug}`,
    })),
    ...notes.map((note) => ({
      title: note.frontmatter.title,
      views: note.frontmatter.views,
      type: 'Note',
      url: `/notes/${note.frontmatter.slug}`,
    })),
  ]

  allContent.sort((a, b) => b.views - a.views)

  return (
    <Prose>
      <h1>
        Content Stats (Total:{' '}
        {allContent.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
        )
      </h1>
      <ItemList>
        {allContent.map((item) => (
          <ItemListItem
            key={item.url}
            right={<>{item.views.toLocaleString()} views</>}
            left={
              <>
                <a href={item.url}>{item.title}</a> ({item.type})
              </>
            }
          />
        ))}
      </ItemList>
    </Prose>
  )
}
