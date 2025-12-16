'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FamilyItem, FamilyItemCreate } from '@/core/models/familyItem'

interface ItemFormProps {
  item?: FamilyItem
  onCancel?: () => void
}

export default function ItemForm({ item, onCancel }: ItemFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FamilyItemCreate>({
    type: item?.type || 'task',
    title: item?.title || '',
    description: item?.description || undefined,
    start_at: item?.start_at || null,
    end_at: item?.end_at || null,
    deadline_at: item?.deadline_at || null,
    status: item?.status || 'open',
    checklist: item?.checklist || undefined,
    tags: item?.tags || undefined,
    priority: item?.priority || undefined,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = item ? `/api/items/${item.id}` : '/api/items'
      const method = item ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save item')
      }

      router.push('/today')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{item ? 'Edit Item' : 'Add Item'}</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="task">Task</option>
            <option value="event">Event</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {formData.type === 'event' && (
          <>
            <div>
              <label htmlFor="start_at" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                id="start_at"
                type="datetime-local"
                value={formData.start_at ? new Date(formData.start_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_at" className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                id="end_at"
                type="datetime-local"
                value={formData.end_at ? new Date(formData.end_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {(formData.type === 'task' || formData.type === 'deadline') && (
          <div>
            <label htmlFor="deadline_at" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              id="deadline_at"
              type="datetime-local"
              value={formData.deadline_at ? new Date(formData.deadline_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, deadline_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority (1-5)
          </label>
          <input
            id="priority"
            type="number"
            min="1"
            max="5"
            value={formData.priority || ''}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : item ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
