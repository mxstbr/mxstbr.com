'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Toaster, toast } from 'react-hot-toast'
// import { submitFeedback } from './send-feedback-action'
import { ChevronDown, Edit2 } from 'react-feather'
import { colors } from './data'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="text-sm px-4 py-1 shrink-0 bg-slate-900 text-white dark:bg-slate-300 dark:text-slate-900 rounded-md"
      type="submit"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create event ->'}
    </button>
  )
}

export default function CreateEventForm({
  createEventAction,
}: {
  createEventAction: (formData: FormData) => Promise<Boolean>
}) {
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState<keyof typeof colors>('blue')
  const [border, setBorder] = useState('')
  const [background, setBackground] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (startDate && !endDate) {
      setEndDate(startDate)
    }
  }, [startDate])

  async function clientAction(formData: FormData) {
    const startDate = formData.get('startDate')
    const endDate = formData.get('endDate')
    if (!startDate || !endDate || !color) {
      toast.error('Start date, end date, or color missing.')
      return
    }
    const success = await createEventAction(formData)
    if (success) {
      toast.success('Event created')
      setLabel('')
      setStartDate('')
      setEndDate('')
      setColor('blue')
      setBorder('')
      setBackground('')
    } else {
      toast.error('Failed to create event. Please try again.')
    }
  }

  return (
    <div
      className={`fixed bottom-0 right-0 z-10 ${isExpanded ? 'w-full sm:w-96' : ''}`}
    >
      {isExpanded ? (
        <form
          action={clientAction}
          className="sm:mb-4 sm:mr-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg p-6 pb-8 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-semibold mt-0 dark:text-white">Create event</h2>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false)
              }}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          <div className="flex flex-row items-stretch justify-between gap-2">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
          </div>
          <input
            name="label"
            type="text"
            placeholder="Event label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border rounded-md w-full border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />

          <div className="flex flex-row items-stretch justify-between gap-2">
            <select
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value as keyof typeof colors)}
              className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            >
              <option selected value="">
                Color
              </option>
              {Object.keys(colors).map((name) => (
                <option key={name} value={colors[name]}>
                  {name}
                </option>
              ))}
            </select>
            <select
              name="border"
              value={border}
              onChange={(e) => setBorder(e.target.value)}
              className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option selected value="">
                Border (optional)
              </option>
              <option value="solid">solid</option>
            </select>
          </div>
          <select
            name="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">Background (optional)</option>
            <option value="architect">architect</option>
            <option value="texture">texture</option>
            <option value="charlieBrown">charlieBrown</option>
            <option value="hexagons">hexagons</option>
            <option value="bamboo">bamboo</option>
            <option value="corkScrew">corkScrew</option>
            <option value="tinyCheckers">tinyCheckers</option>
            <option value="heavyRain">heavyRain</option>
            <option value="flippedDiamonds">flippedDiamonds</option>
            <option value="morphingDiamonds">morphingDiamonds</option>
            <option value="boxes">boxes</option>
            <option value="zigZag">zigZag</option>
            <option value="diagonalLines">diagonalLines</option>
            <option value="eyes">eyes</option>
            <option value="polkaDots">polkaDots</option>
          </select>
          <div className="flex flex-row items-stretch justify-between gap-4">
            <SubmitButton />
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setIsExpanded(true)
          }}
          className={`mb-4 mr-4 w-12 h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors`}
        >
          <Edit2 size={20} />
        </button>
      )}
    </div>
  )
}
