'use client'

import { useState } from 'react'
import { ChevronDown, MessageSquare } from 'react-feather'
import Chat from 'app/cal/chat'

export function ClippyChoresChat() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`fixed bottom-0 right-0 z-20 ${
        isOpen ? 'w-full sm:w-[32rem]' : ''
      }`}
    >
      {isOpen ? (
        <div className="sm:mb-4 sm:mr-4 flex max-h-[80vh] flex-col gap-4 rounded-lg border bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:max-h-[95vh]">
          <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100">
            <span>Clippy for chores</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Minimize chat"
            >
              <ChevronDown size={18} />
            </button>
          </div>
          <div className="px-3 pb-3">
            <Chat />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mb-4 mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          aria-label="Open Clippy chat"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  )
}
