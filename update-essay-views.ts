import fs from 'fs'
import path from 'path'
import { Redis } from '@upstash/redis'
import { getBlogPosts } from './app/thoughts/utils'
import env from '@next/env'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

const redis = Redis.fromEnv()

async function main() {
  const posts = getBlogPosts({ archived: true })

  const views = await Promise.all(
    posts.map(async (post) => ({
      views:
        (await redis.get<number>(
          ['pageviews', 'essay', post.slug].join(':')
        )) ?? 0,
      slug: post.slug,
    }))
  )

  // Disallow updating views if the views are lower than whats already been recorded
  // that must mean something's wrong with the data.
  if (
    posts.some(
      (post) =>
        post.metadata.views >
        (views.find((v) => v.slug === post.slug)?.views || 0)
    )
  ) {
    const lower = posts
      .filter(
        (post) =>
          post.metadata.views >
          (views.find((v) => v.slug === post.slug)?.views || 0)
      )
      .map((post) => post.slug)

    throw new Error(
      `Views for essay(s) ${lower.join(
        `, `
      )} are lower than whats hardcoded in their metadata. Aborting update.`
    )
  }

  // Update each blog post file with the latest view count
  for (const post of posts) {
    const filePath = path.join(projectDir, `app/thoughts/${post.slug}/page.mdx`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const updatedContent = fileContent.replace(
      /export const meta = {([\s\S]*?)(?:^|,\s*)(views:\s*(?:\d+\s*\+\s*\d+|\d+))\s*,?\s*}/,
      (match, properties) => {
        const viewCount = views.find((v) => v.slug === post.slug)?.views || 0
        if (viewCount === post.metadata.views) return match
        console.log(
          `Updating ${post.slug} with view count ${viewCount.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 0,
            }
          )} (+${viewCount - post.metadata.views})`
        )
        return `export const meta = {\n  ${properties
          .trim()
          .replace(/,?\s*$/, '')},\n  views: ${viewCount}\n}`
      }
    )
    fs.writeFileSync(filePath, updatedContent, 'utf-8')
  }

  console.log('Done!')
}

main()
