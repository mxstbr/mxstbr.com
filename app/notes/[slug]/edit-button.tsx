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
      className="fixed bottom-8 right-8 bg-white rounded-full p-4 shadow-md text-slate-500"
      target="_blank"
      href={`https://hashnode.com/edit/${cuid}`}
    >
      <Edit />
    </a>
  )
}
