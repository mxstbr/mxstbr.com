'use client'
import { useEffect, useRef } from 'react'

export function useChoreSounds() {
  const sounds = useRef<{
    chore: HTMLAudioElement
    reward: HTMLAudioElement
  } | null>(null)
  useEffect(() => {
    sounds.current = {
      chore: new Audio('/static/audio/chores/cha-ching-money.mp3'),
      reward: new Audio('/static/audio/rewards/successwasd.mp3'),
    }
    Object.values(sounds.current).forEach((a) => {
      a.preload = 'auto'
    })
    return () => {
      Object.values(sounds.current || {}).forEach((a) => a.pause())
      sounds.current = null
    }
  }, [])
  const prime = (kind: 'chore' | 'reward') => {
    const audio = sounds.current?.[kind]
    if (!audio) return
    audio.muted = true
    void audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      })
      .catch(() => {
        audio.muted = false
      })
  }
  const play = (kind: 'chore' | 'reward') => {
    const audio = sounds.current?.[kind]
    if (audio) {
      audio.muted = false
      audio.currentTime = 0
      void audio.play().catch(() => {})
    }
  }
  return { prime, play }
}
