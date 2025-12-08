'use client'
import { Event } from './data'

export function DeleteButton({
  deleteEventAction,
  event,
}: {
  deleteEventAction: (event: Event) => void
  event: Event
}) {
  return (
    <button className="text-blue-500" onClick={() => deleteEventAction(event)}>
      Delete
    </button>
  )
}
