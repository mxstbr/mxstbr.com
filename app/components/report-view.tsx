'use client'

import { useEffect } from 'react'

export const ReportView: React.FC<{ slug: string }> = ({ slug }) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    fetch('/api/incr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    })
  }, [slug])

  return null
}
