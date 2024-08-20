'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export const ReportView = () => {
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/incr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }, [pathname])

  return null
}
