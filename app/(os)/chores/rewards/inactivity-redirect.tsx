'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type InactivityRedirectProps = {
  href: string
  timeoutMs?: number
}

export function InactivityRedirect({
  href,
  timeoutMs = 2 * 60 * 1000,
}: InactivityRedirectProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        router.push(href)
      }, timeoutMs)
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'click',
      'touchstart',
      'wheel',
    ]

    resetTimer()
    for (const event of events) {
      window.addEventListener(event, resetTimer)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of events) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [href, timeoutMs, router])

  return null
}
