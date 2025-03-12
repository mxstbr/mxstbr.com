'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Toaster, toast } from 'react-hot-toast'
// import { submitFeedback } from './send-feedback-action'
import { ChevronDown, Edit2 } from 'react-feather'
import { colors, BackgroundPattern, Border } from './data'

// Define preset types
type Preset = {
  name: string
  color: keyof typeof colors
  background: BackgroundPattern
  border: Border | ''
}

// Define presets
const PRESETS: Preset[] = [
  {
    name: 'Kids',
    color: 'green',
    background: 'texture',
    border: 'solid',
  },
  {
    name: 'Personal',
    color: 'yellow',
    background: 'diagonalLines',
    border: 'solid',
  },
  {
    name: 'Work',
    color: 'pink',
    background: 'diagonalLines',
    border: 'solid',
  },
  {
    name: 'Sue',
    color: 'blue',
    background: 'texture',
    border: 'solid',
  },
]

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
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Apply preset settings
  const applyPreset = (preset: Preset) => {
    setColor(preset.color)
    setBackground(preset.background)
    setBorder(preset.border)
    setActivePreset(preset.name)
  }

  async function clientAction(formData: FormData) {
    const startDate = formData.get('startDate')
    const endDate = formData.get('endDate')
    const selectedColor = formData.get('color') as keyof typeof colors

    if (!startDate || !endDate || !selectedColor) {
      toast.error('Start date, end date, or color missing.')
      return
    }

    // Replace the color name with the actual color value
    const colorValue = colors[selectedColor]
    formData.set('color', colorValue)

    const success = await createEventAction(formData)
    if (success) {
      toast.success('Event created')
      setLabel('')
      setStartDate('')
      setEndDate('')
      setColor('blue')
      setBorder('')
      setBackground('')
      setActivePreset(null)
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

          {/* Presets section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`text-xs px-3 py-1 rounded-md border ${
                    activePreset === preset.name
                      ? 'bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500'
                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                  style={{
                    borderColor:
                      activePreset === preset.name
                        ? colors[preset.color]
                        : undefined,
                    borderLeftWidth: preset.border ? '4px' : undefined,
                    borderLeftColor: colors[preset.color],
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span className="relative z-10">{preset.name}</span>
                  {/* Background pattern indicator */}
                  {preset.background && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H0V0h5z'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize:
                          preset.background === 'diagonalLines'
                            ? '6px 6px'
                            : '20px 20px',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            {activePreset && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Using {activePreset} preset. You can still override settings
                below.
              </p>
            )}
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
                onChange={(e) => {
                  const newStartDate = e.target.value
                  setStartDate(newStartDate)

                  // If end date is empty or start date is after end date, update end date
                  if (!endDate || newStartDate > endDate) {
                    setEndDate(newStartDate)
                  }
                }}
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
              onChange={(e) => {
                setColor(e.target.value as keyof typeof colors)
                setActivePreset(null) // Clear active preset when manually changing settings
              }}
              className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            >
              <option value="">Color</option>
              {Object.keys(colors).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              name="border"
              value={border}
              onChange={(e) => {
                setBorder(e.target.value)
                setActivePreset(null) // Clear active preset when manually changing settings
              }}
              className="text-sm border rounded-md w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Border (optional)</option>
              <option value="solid">solid</option>
            </select>
          </div>
          <select
            name="background"
            value={background}
            onChange={(e) => {
              setBackground(e.target.value)
              setActivePreset(null) // Clear active preset when manually changing settings
            }}
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
