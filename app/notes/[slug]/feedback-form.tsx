'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Toaster, toast } from 'react-hot-toast'
import { submitFeedback } from './send-feedback-action'
import { usePathname } from 'next/navigation'
import { ChevronDown, MessageSquare } from 'react-feather'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="text-sm px-4 py-1 shrink-0 bg-slate-900 text-white dark:bg-slate-300 dark:text-slate-900 rounded-md"
      type="submit"
      disabled={pending}
    >
      {pending ? 'Sending…' : 'Send to Max ->'}
    </button>
  )
}

export default function FeedbackForm() {
  const [thoughts, setThoughts] = useState('')
  const [email, setEmail] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // 640px is the 'sm' breakpoint in Tailwind
      setIsExpanded(window.innerWidth >= 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function clientAction(formData: FormData) {
    const result = await submitFeedback(
      formData,
      pathname.replace('/notes/', ''),
    )
    if (result.success) {
      toast.success('Feedback Submitted')
      setThoughts('')
      setEmail('')
    } else {
      toast.error('Failed to submit feedback. Please try again.')
    }
  }

  return (
    <div
      className={`fixed bottom-0 right-0 ${isExpanded ? 'w-full sm:w-96' : ''}`}
    >
      {isExpanded ? (
        <form
          action={clientAction}
          className="sm:mb-4 sm:mr-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg p-6 pb-8 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-semibold mt-0 dark:text-white">
              I want to know what you think!
            </h2>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          <textarea
            name="thoughts"
            placeholder="What's your take on this? What resonates or doesn't resonate?"
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            className="border rounded-md w-full border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            required
            data-enable-grammarly="false"
          />
          <div className="flex flex-row items-stretch justify-between gap-4">
            <input
              name="email"
              type="email"
              placeholder="Email for replies (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              data-enable-grammarly="false"
            />
            <SubmitButton />
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`mb-4 mr-4 w-12 h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors`}
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  )
}
