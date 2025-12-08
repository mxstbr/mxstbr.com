import React from 'react'
import { getBlogPosts } from '../thoughts/utils'
import { getNotes } from '../notes/hashnode'
import { isMax } from 'app/auth'
import { notFound } from 'next/navigation'
import Prose from 'app/components/prose'
import { ItemList, ItemListItem } from 'app/components/item-list'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

async function getLatestViews(slug: string): Promise<number> {
  return (
    (await redis.get<number>(['pageviews', `/thoughts/${slug}`].join(':'))) ?? 0
  )
}

export default async function StatsPage() {
  if (!(await isMax())) return notFound()

  const essays = getBlogPosts({ archived: true })
  const notes = await getNotes()

  const essaysWithViews = await Promise.all(
    essays.map(async (essay) => ({
      title: essay.metadata.title,
      views: await getLatestViews(essay.slug),
      type: 'Essay',
      url: `/thoughts/${essay.slug}`,
    })),
  )

  const allContent = [
    ...essaysWithViews,
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
        Content Stats (Total Views:{' '}
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
