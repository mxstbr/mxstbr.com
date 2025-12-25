import fs from 'fs'
import path from 'path'

const META = /export\s+const\s+meta\s+=\s+(\{(\n|.)*?\n\})/

type Status = 'seedling' | 'budding' | 'evergreen' | 'link'

type Metadata = {
  title: string
  summary: string
  publishedAt: string
  updatedAt?: string
  status: Status
  tags?: Array<{
    name: string
    slug: string
  }>
  previousSlugs: Array<string>
  views: number
}

export type Note = {
  metadata: Metadata
  slug: string
  content: string
}

function parseFrontmatter(fileContent: string) {
  const match = META.exec(fileContent)
  if (!match || typeof match[1] !== 'string')
    throw new Error(`Note needs to export const meta = {}`)

  const meta = eval('(' + match[1] + ')')
  let content = fileContent.replace(META, '').trim()

  return {
    metadata: {
      // Default values
      views: 0,
      tags: [],
      previousSlugs: [],
      status: 'seedling',
      ...meta,
    } as Metadata,
    content,
  }
}

function getMDXFiles(dir: string) {
  let files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const subfolders = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const subfolder of subfolders) {
    const subfolderPath = path.join(dir, subfolder)
    const subfolderFiles = fs
      .readdirSync(subfolderPath)
      .filter((file) => file === 'index.mdx') // Notes use index.mdx
      .map((file) => path.join(subfolder, file))
    files.push(...subfolderFiles)
  }

  return files
}

function readMDXFile(filePath: string) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

function getMDXData(dir: string) {
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

export function getNotes(): Array<Note> {
  return getMDXData(
    path.join(process.cwd(), 'app', '(public)', 'notes', 'content'),
  ).sort((a, b) => {
    // Sort by updatedAt if available, otherwise publishedAt
    const aDate = a.metadata.updatedAt || a.metadata.publishedAt
    const bDate = b.metadata.updatedAt || b.metadata.publishedAt
    
    if (new Date(aDate) > new Date(bDate)) {
      return -1
    }
    return 1
  })
}

export function getNote(slug: string): Note | null {
  const notes = getNotes()
  return notes.find((note) => note.slug === slug) || null
}

export const EMOJI_FOR_STATUS: Record<Status, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
  link: '🔗',
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
    day: '2-digit',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
