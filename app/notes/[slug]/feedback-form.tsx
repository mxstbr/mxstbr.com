'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Toaster, toast } from 'react-hot-toast'
import { submitFeedback } from './send-feedback-action'
import { usePathname } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="text-sm px-4 py-1 shrink-0 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-md"
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
  const pathname = usePathname()

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
    <form
      action={clientAction}
      className="fixed bottom-0 right-0 w-full sm:bottom-4 sm:right-4 sm:w-96 bg-card p-6 pb-8 sm:rounded-lg shadow-lg bg-white border flex flex-col gap-4"
    >
      <h2 className="font-semibold mt-0">I want to know what you think!</h2>
      <textarea
        name="thoughts"
        placeholder="What's your take on this? What resonates or doesn't resonate?"
        value={thoughts}
        onChange={(e) => setThoughts(e.target.value)}
        className="border rounded-md w-full border-slate-300 text-sm"
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
          className="text-sm border rounded-md w-full border-slate-300"
          data-enable-grammarly="false"
        />
        <SubmitButton />
      </div>
    </form>
  )
}
