import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const SOUND_FOLDERS: Record<string, string> = {
  choreComplete: 'chores',
  rewardRedeem: 'rewards',
}

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const folder = type ? SOUND_FOLDERS[type] : null

  if (!folder) {
    return NextResponse.json({ files: [] })
  }

  const baseDir = path.join(process.cwd(), 'public', 'static', 'audio', folder)

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => `/static/audio/${folder}/${entry.name}`)

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Failed to read audio directory', folder, error)
    return NextResponse.json({ files: [] })
  }
}
