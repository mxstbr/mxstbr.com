'use client'
import React, { useEffect, useState } from 'react'
import Edit from 'react-feather/dist/icons/edit-3'

export function EditButton({ cuid }: { cuid: string }) {
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    fetch(`/api/auth`)
      .then((res) => res.text())
      .then((res) => {
        if (res === 'true') {
          setIsAuth(true)
        } else {
          setIsAuth(false)
        }
      })
  }, [])

  if (!isAuth) return null

  return (
    <a
      className="fixed bottom-20 right-4 w-12 h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
      target="_blank"
      href={`https://hashnode.com/edit/${cuid}`}
    >
      <Edit />
    </a>
  )
}
