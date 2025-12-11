'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { isPacificNighttime } from './utils'

const INACTIVITY_TIMEOUT_MS = 60_000
const TIME_CHECK_INTERVAL_MS = 30_000

export function ScreenSaver({ noChoresToday }: { noChoresToday: boolean }) {
  const [isNighttime, setIsNighttime] = useState(() => isPacificNighttime())
  const [visible, setVisible] = useState(false)
  const resetTimerRef = useRef<() => void>(() => {})

  useEffect(() => {
    const updateNighttime = () => setIsNighttime(isPacificNighttime())
    updateNighttime()
    const id = window.setInterval(updateNighttime, TIME_CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  const shouldEnable = noChoresToday || isNighttime

  useEffect(() => {
    if (!shouldEnable) {
      setVisible(false)
      resetTimerRef.current = () => {}
      return
    }

    let timeoutId: number
    const resetTimer = () => {
      window.clearTimeout(timeoutId)
      setVisible(false)
      timeoutId = window.setTimeout(() => setVisible(true), INACTIVITY_TIMEOUT_MS)
    }

    resetTimerRef.current = resetTimer

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(timeoutId)
        setVisible(false)
        return
      }
      resetTimer()
    }

    const events: Array<keyof WindowEventMap> = ['pointermove', 'pointerdown', 'keydown', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibilityChange)

    resetTimer()

    return () => {
      window.clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resetTimerRef.current = () => {}
    }
  }, [shouldEnable])

  if (!shouldEnable || !visible) return null

  const handleOverlayInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    resetTimerRef.current()
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black transition-opacity duration-200"
      aria-hidden="true"
      onPointerDown={handleOverlayInteraction}
      onPointerUp={handleOverlayInteraction}
      onClick={handleOverlayInteraction}
    />
  )
}
