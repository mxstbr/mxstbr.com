'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshButton } from './refresh-button'

type ChoresErrorBoundaryProps = {
  children: ReactNode
  label: string
}

type ChoresErrorBoundaryState = {
  hasError: boolean
}

export class ChoresErrorBoundary extends Component<
  ChoresErrorBoundaryProps,
  ChoresErrorBoundaryState
> {
  state: ChoresErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ChoresErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Surface errors in the console while keeping the refresh control visible.
    console.error(`[ChoresErrorBoundary] ${this.props.label}`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-slate-300 bg-white/70 p-4 text-sm text-slate-800 shadow-xs backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">We couldn't load {this.props.label}.</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Refresh to try again. If the error persists, please let Max know.
              </p>
            </div>
            <RefreshButton />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
