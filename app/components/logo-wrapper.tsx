'use client'
import Logo from './logo'
import { useState, useRef, useEffect } from 'react'
// @ts-ignore
import { useHover } from '@uidotdev/usehooks'

export default function LogoWrapper() {
  const [intervalPassed, setIntervalPassed] = useState(false)
  const [ref, hovering] = useHover()

  useInterval(() => {
    setIntervalPassed(true)
  }, 1000)

  const expanded = intervalPassed ? hovering : !hovering

  return (
    <div ref={ref} className="flex py-1 px-2 m-1 space-x-4 items-center">
      <Logo expanded={expanded} />
    </div>
  )
}

// From: https://www.joshwcomeau.com/snippets/react-hooks/use-interval/
function useInterval(callback: Function, delay: number) {
  const intervalRef = useRef<number | undefined>(undefined)
  const savedCallback = useRef(callback)
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  useEffect(() => {
    const tick = () => savedCallback.current()
    if (typeof delay === 'number') {
      intervalRef.current = window.setInterval(tick, delay)
      return () => window.clearInterval(intervalRef.current)
    }
  }, [delay])
  return intervalRef
}
