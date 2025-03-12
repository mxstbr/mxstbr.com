'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Event, colors } from './data'
import type { BackgroundPattern } from './data'
import { DeleteButton } from './delete-button'
import { format } from './date-utils'

function EditEventForm({
  event,
  onCancel,
  updateEvent,
}: {
  event: Event
  onCancel: () => void
  updateEvent: (oldEvent: Event, formData: FormData) => Promise<boolean>
}) {
  async function clientAction(formData: FormData) {
    const success = await updateEvent(event, formData)
    if (success) {
      toast.success('Event updated')
      onCancel()
    } else {
      toast.error('Failed to update event. Please try again.')
    }
  }

  return (
    <form action={clientAction} className="mt-2 space-y-4">
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-slate-300">
            Start date
          </label>
          <input
            name="startDate"
            type="date"
            defaultValue={event.start}
            className="text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-slate-300">
            End date
          </label>
          <input
            name="endDate"
            type="date"
            defaultValue={event.end}
            className="text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-300">
          Label
        </label>
        <input
          name="label"
          type="text"
          defaultValue={event.label}
          placeholder="Event label (optional)"
          className="w-full text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 dark:text-slate-300">
            Color
          </label>
          <select
            name="color"
            defaultValue={event.color}
            className="w-full text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            required
          >
            {Object.entries(colors).map(([name, value]) => (
              <option key={name} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 dark:text-slate-300">
            Border
          </label>
          <select
            name="border"
            defaultValue={event.border}
            className="w-full text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="">None</option>
            <option value="solid">solid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-300">
          Background
        </label>
        <select
          name="background"
          defaultValue={event.background}
          className="w-full text-sm border rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="">None</option>
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
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function EventListItem({
  event,
  index,
  deleteEvent,
  updateEvent,
}: {
  event: Event
  index: number
  deleteEvent: (event: Event) => Promise<boolean>
  updateEvent: (oldEvent: Event, formData: FormData) => Promise<boolean>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const eventId = `${event.start}-${event.end}-${event.label || 'untitled'}`

  if (isEditing) {
    return (
      <li key={index} className="mb-4">
        <EditEventForm
          event={event}
          onCancel={() => setIsEditing(false)}
          updateEvent={updateEvent}
        />
      </li>
    )
  }

  return (
    <li id={eventId} key={index} className="mb-4 dark:text-slate-300">
      <p>
        <strong>Label:</strong> {event.label || <em>Untitled</em>}
      </p>
      <p>
        <strong>Start:</strong> {event.start}
      </p>
      <p>
        <strong>End:</strong> {event.end}
      </p>
      <p>
        <strong>Color:</strong> {event.color}
      </p>
      {event.border && (
        <p>
          <strong>Border:</strong> {event.border}
        </p>
      )}
      {event.background && (
        <p>
          <strong>Background:</strong> {event.background}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        <button className="text-blue-500" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <DeleteButton deleteEventAction={deleteEvent} event={event} />
      </div>
    </li>
  )
}

export function EventList({
  events,
  deleteEvent,
  updateEvent,
}: {
  events: Event[]
  deleteEvent: (event: Event) => Promise<boolean>
  updateEvent: (oldEvent: Event, formData: FormData) => Promise<boolean>
}) {
  return (
    <ol className="list-decimal pl-5">
      {events
        .sort((a, b) => {
          // Compare end dates as strings (YYYY-MM-DD format sorts correctly)
          return a.end > b.end ? -1 : a.end < b.end ? 1 : 0
        })
        .map((event, index) => (
          <EventListItem
            key={index}
            event={event}
            index={index}
            deleteEvent={deleteEvent}
            updateEvent={updateEvent}
          />
        ))}
    </ol>
  )
}
