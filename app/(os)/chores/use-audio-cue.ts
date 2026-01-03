'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AudioCache = Record<string, HTMLAudioElement>

type RandomAudioCueOptions = {
  type: 'choreComplete' | 'rewardRedeem'
}

type AudioCue = {
  play: () => void
  prefetch: () => void
  isReady: boolean
}

export function useRandomAudioCue(options: RandomAudioCueOptions): AudioCue {
  const [sources, setSources] = useState<string[]>([])
  const cacheRef = useRef<AudioCache>({})
  const nextSrcRef = useRef<string | null>(null)
  const hasWindow = typeof window !== 'undefined'
  const endpoint = useMemo(
    () => `/api/audio-cues?type=${options.type}`,
    [options.type],
  )

  useEffect(() => {
    let cancelled = false

    const fetchSources = async () => {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as { files?: string[] }
        if (!cancelled && Array.isArray(data.files)) {
          setSources(data.files)
        }
      } catch (error) {
        console.error('Failed to load audio cues', error)
      }
    }

    if (hasWindow) {
      void fetchSources()
    }

    return () => {
      cancelled = true
      cacheRef.current = {}
    }
  }, [endpoint, hasWindow])

  const getRandomSource = useCallback(() => {
    if (!sources.length) return null
    const index = Math.floor(Math.random() * sources.length)
    return sources[index]
  }, [sources])

  const ensureAudio = useCallback(
    (src: string | null) => {
      if (!src) return null
      if (cacheRef.current[src]) return cacheRef.current[src]
      if (!hasWindow) return null

      const audio = new Audio(src)
      audio.preload = 'auto'
      cacheRef.current[src] = audio
      return audio
    },
    [hasWindow],
  )

  const prefetch = useCallback(() => {
    const src = getRandomSource()
    ensureAudio(src)
    nextSrcRef.current = src
  }, [ensureAudio, getRandomSource])

  const play = useCallback(() => {
    const src = nextSrcRef.current ?? getRandomSource()
    const audio = ensureAudio(src)
    if (!audio) return
    nextSrcRef.current = null

    audio.currentTime = 0
    void audio.play().catch((error) => {
      console.error('Failed to play audio cue', error)
    })
  }, [ensureAudio, getRandomSource])

  return { play, prefetch, isReady: sources.length > 0 }
}
