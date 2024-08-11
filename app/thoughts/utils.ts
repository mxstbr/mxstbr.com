import fs from 'fs'
import path from 'path'

const META = /export\s+const\s+meta\s+=\s+(\{(\n|.)*?\n\})/

type Metadata = {
  title: string
  publishedAt: string
  updatedAt?: string
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
  let content = fileContent.replace(META, '').trim()

  return {
    metadata: {
      // Default views to 0
      views: 0,
      ...meta,
    } as Metadata,
    content,
  }
}

function getMDXFiles(dir) {
  let files: string[] = []

  const subfolders = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const subfolder of subfolders) {
    const subfolderPath = path.join(dir, subfolder)
    const subfolderFiles = fs
      .readdirSync(subfolderPath)
      .filter((file) => file === 'page.mdx') // Only include page.mdx files
      .map((file) => path.join(subfolder, file))
    files.push(...subfolderFiles)
  }

  return files
}

function readMDXFile(filePath) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

function getMDXData(dir) {
  let mdxFiles = getMDXFiles(dir)
  return mdxFiles.map((file) => {
    let { metadata, content } = readMDXFile(path.join(dir, file))
    let slug = path.basename(path.dirname(file))

    return {
      metadata,
      slug,
      content,
    }
  })
}

export function getBlogPosts({
  drafts = false,
  archived = false,
}: { drafts?: boolean; archived?: boolean } = {}) {
  return getMDXData(path.join(process.cwd(), 'app', 'thoughts'))
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

export function formatDate(date: string, includeRelative = false) {
  let currentDate = new Date()
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  let targetDate = new Date(date)

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear()
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth()
  let daysAgo = currentDate.getDate() - targetDate.getDate()

  let formattedDate = ''

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`
  } else {
    formattedDate = 'Today'
  }

  let fullDate = targetDate.toLocaleString('en-us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
