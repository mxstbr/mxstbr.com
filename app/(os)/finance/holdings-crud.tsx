'use client'

import { useState } from 'react'
import { type StockHolding } from './holdings-data'

interface HoldingEditFormProps {
  holding: StockHolding
  index: number
  onCancel: () => void
  editAction: (formData: FormData) => Promise<void>
}

export function HoldingEditForm({ holding, index, onCancel, editAction }: HoldingEditFormProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await editAction(formData)
    } catch (error) {
      console.error('Error updating holding:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
      <input type="hidden" name="index" value={index} />
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`ticker-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ticker
          </label>
          <input
            id={`ticker-${index}`}
            name="ticker"
            type="text"
            defaultValue={holding.ticker}
            required
            className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label htmlFor={`shares-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Shares
          </label>
          <input
            id={`shares-${index}`}
            name="shares"
            type="number"
            step="0.001"
            defaultValue={holding.shares}
            required
            className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label htmlFor={`date-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            id={`date-${index}`}
            name="date"
            type="date"
            defaultValue={holding.date}
            required
            className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface HoldingDeleteButtonProps {
  index: number
  ticker: string
  deleteAction: (formData: FormData) => Promise<void>
}

export function HoldingDeleteButton({ index, ticker, deleteAction }: HoldingDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('index', index.toString())
      await deleteAction(formData)
    } catch (error) {
      console.error('Error deleting holding:', error)
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-sm transition-colors"
        >
          {loading ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
    >
      Delete
    </button>
  )
}

interface AddHoldingFormProps {
  createAction: (formData: FormData) => Promise<void>
}

export function AddHoldingForm({ createAction }: AddHoldingFormProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createAction(formData)
      setShowForm(false)
      // Reset form
      const form = document.getElementById('add-holding-form') as HTMLFormElement
      form?.reset()
    } catch (error) {
      console.error('Error creating holding:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
      >
        + Add New Holding
      </button>
    )
  }

  return (
    <form id="add-holding-form" action={handleSubmit} className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <h4 className="text-sm font-medium text-green-900 dark:text-green-100">Add New Holding</h4>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="new-ticker" className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            Ticker
          </label>
          <input
            id="new-ticker"
            name="ticker"
            type="text"
            placeholder="AAPL"
            required
            className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label htmlFor="new-shares" className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            Shares
          </label>
          <input
            id="new-shares"
            name="shares"
            type="number"
            step="0.001"
            placeholder="100.000"
            required
            className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label htmlFor="new-date" className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            Date
          </label>
          <input
            id="new-date"
            name="date"
            type="date"
            required
            className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-md transition-colors"
        >
          {loading ? 'Adding...' : 'Add Holding'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface HoldingsListItemProps {
  holding: StockHolding
  index: number
  editAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export function HoldingsListItem({ holding, index, editAction, deleteAction }: HoldingsListItemProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <HoldingEditForm
        holding={holding}
        index={index}
        onCancel={() => setIsEditing(false)}
        editAction={editAction}
      />
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {holding.ticker}
          </span>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {holding.shares.toFixed(3)} shares
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {holding.date}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm transition-colors"
        >
          Edit
        </button>
        <HoldingDeleteButton
          index={index}
          ticker={holding.ticker}
          deleteAction={deleteAction}
        />
      </div>
    </div>
  )
}
