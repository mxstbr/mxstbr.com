import { writeFileSync } from 'fs'
import fs from 'fs'
import path from 'path'

const META = /export\s+const\s+meta\s+=\s+(\{(\n|.)*?\n\})/

type Metadata = {
  title: string
  publishedAt: string
  summary: string
  state: 'draft' | 'published' | 'archived'
  views: number
  image?: string
}

function parseFrontmatter(fileContent: string) {
  const match = META.exec(fileContent)
  if (!match || typeof match[1] !== 'string')
    throw new Error(`${name} needs to export const meta = {}`)

  const meta = eval('(' + match[1] + ')')

  return {
    metadata: {
      // Default views to 0
      views: 0,
      ...meta,
    } as Metadata,
  }
}

function getBlogPosts({
  drafts = false,
  archived = false,
}: { drafts?: boolean; archived?: boolean } = {}) {
  let files: string[] = []

  const subfolders = fs
    .readdirSync(path.resolve(process.cwd(), './app', 'thoughts'), {
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const subfolder of subfolders) {
    const subfolderPath = path.join(
      path.resolve(process.cwd(), './app', 'thoughts'),
      subfolder
    )
    const subfolderFiles = fs
      .readdirSync(subfolderPath)
      .filter((file) => file === 'page.mdx')
      .map((file) => path.join(subfolder, file))
    files.push(...subfolderFiles)
  }

  return files
    .map((file) => {
      let rawContent = fs.readFileSync(
        path.join(path.resolve(process.cwd(), './app', 'thoughts'), file),
        'utf-8'
      )
      let { metadata } = parseFrontmatter(rawContent)
      let slug = path.basename(path.dirname(file))

      return {
        metadata,
        slug,
      }
    })
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1
      }
      return 1
    })
    .filter((post) => {
      if (drafts && post.metadata.state === 'draft') return true
      if (archived && post.metadata.state === 'archived') return true

      return post.metadata.state === 'published'
    })
}

async function main() {
  const posts = getBlogPosts({ archived: true, drafts: true })
  writeFileSync('./app/data/blog-posts.json', JSON.stringify(posts, null, 2))
}

main()
