'use client'
import { useEffect, useState } from 'react'
import { Note } from '../utils'

export function ReadingTime({
  readTimeInMinutes,
  domElementId,
}: {
  readTimeInMinutes: number | undefined
  domElementId: string
}) {
  const [time, setTime] = useState(readTimeInMinutes || 0)

  useEffect(() => {
    function getElementScrollScale(): number {
      const windowBottom = window.scrollY + window.innerHeight
      const elem = document.getElementById(domElementId)
      if (!elem) return 0
      const elementTop = elem.getBoundingClientRect().top + window.scrollY
      const elementHeight = elem.offsetHeight
      return ((windowBottom - elementTop) / elementHeight) * 100
    }

    function scrollListener() {
      const percentage = getElementScrollScale()

      setTime(Math.ceil(((readTimeInMinutes || 0) * (100 - percentage)) / 100))
    }

    window.addEventListener('scroll', scrollListener)

    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  return (
    <>
      {time <= 1 ? `${time} min` : `${time} mins`}
      {readTimeInMinutes === time ? '' : ' left'}
    </>
  )
}
