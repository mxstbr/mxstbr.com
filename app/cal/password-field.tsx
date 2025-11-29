'use client'

import { useRef, useState } from 'react'

type PasswordFieldProps = {
  name: string
}

export function PasswordField({ name }: PasswordFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)

  const handlePaste = async () => {
    if (!navigator.clipboard) {
      setPasteError('Clipboard unavailable')
      return
    }

    try {
      const text = await navigator.clipboard.readText()
      if (inputRef.current) {
        inputRef.current.value = text
        inputRef.current.focus()
      }
      setPasteError(null)
    } catch (error) {
      console.error('Failed to read clipboard', error)
      setPasteError('Clipboard unavailable')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input ref={inputRef} type="password" name={name} />
        <button type="button" onClick={handlePaste}>
          Paste
        </button>
      </div>
      {pasteError ? <span style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{pasteError}</span> : null}
    </div>
  )
}
