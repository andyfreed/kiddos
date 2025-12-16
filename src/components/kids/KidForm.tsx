'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Kid, KidCreate } from '@/core/models/kid'

interface KidFormProps {
  kid?: Kid
  onCancel?: () => void
}

export default function KidForm({ kid, onCancel }: KidFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<KidCreate>({
    name: kid?.name || '',
    birthday: kid?.birthday || null,
    grade: kid?.grade || null,
    notes: kid?.notes || null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = kid ? `/api/kids/${kid.id}` : '/api/kids'
      const method = kid ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save kid')
      }

      router.push(kid ? `/kids/${kid.id}` : '/kids')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{kid ? 'Edit Kid' : 'Add Kid'}</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
            Birthday
          </label>
          <input
            id="birthday"
            type="date"
            value={formData.birthday || ''}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
            Grade
          </label>
          <input
            id="grade"
            type="text"
            value={formData.grade || ''}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value || null })}
            placeholder="e.g., 3rd Grade, Kindergarten"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            rows={4}
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
            {loading ? 'Saving...' : kid ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
