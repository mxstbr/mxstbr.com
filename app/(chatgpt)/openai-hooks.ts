"use client"

import { useCallback, useSyncExternalStore } from 'react'

const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(SET_GLOBALS_EVENT_TYPE, callback)
  return () => window.removeEventListener(SET_GLOBALS_EVENT_TYPE, callback)
}

function getSnapshot() {
  if (typeof window === 'undefined') return null
  return (window as any).openai ?? null
}

function getServerSnapshot() {
  return null
}

export function useOpenAiGlobal<T = unknown>(key: string): T | null {
  const openai = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return openai?.[key] ?? null
}

export function useWidgetState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const widgetState = useOpenAiGlobal<Record<string, unknown>>('widgetState')
  const setWidgetState = useOpenAiGlobal<((next: Record<string, unknown>) => void)>(
    'setWidgetState',
  )

  const state = (widgetState?.[key] as T | undefined) ?? initialValue

  const setState = useCallback(
    (value: T) => {
      if (!setWidgetState) return
      setWidgetState({ ...(widgetState ?? {}), [key]: value })
    },
    [key, setWidgetState, widgetState],
  )

  return [state, setState]
}

