'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ItemForm from './ItemForm'
import type { FamilyItem } from '@/core/models/familyItem'

interface ItemDetailProps {
  item: FamilyItem
}

function formatDateTime(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return format(date, 'MMM d, yyyy h:mm a')
}

export default function ItemDetail({ item }: ItemDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [status, setStatus] = useState<FamilyItem['status']>(item.status)

  const statusColor = (s: FamilyItem['status']) => {
    switch (s) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'snoozed':
        return 'bg-yellow-100 text-yellow-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const typeLabel = (t: FamilyItem['type']) => {
    switch (t) {
      case 'event':
        return 'Event'
      case 'deadline':
        return 'Deadline'
      default:
        return 'Task'
    }
  }

  const handleStatusChange = async (newStatus: FamilyItem['status']) => {
    if (newStatus === status) return
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      setStatus(newStatus)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Could not update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete item')
      router.push('/today')
      router.refresh()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Could not delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return <ItemForm item={item} onCancel={() => setIsEditing(false)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-800">
              {typeLabel(item.type)}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full ${statusColor(status)}`}>
              {status}
            </span>
          </div>
          <h1 className="text-3xl font-bold mt-2">{item.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as FamilyItem['status'])}
            className="text-sm border border-gray-300 rounded px-3 py-2"
          >
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="snoozed">Snoozed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {item.description && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Description
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          {formatDateTime(item.start_at) && (
            <div>
              <div className="font-semibold text-gray-600">Start</div>
              <div className="text-gray-900">{formatDateTime(item.start_at)}</div>
            </div>
          )}
          {formatDateTime(item.end_at) && (
            <div>
              <div className="font-semibold text-gray-600">End</div>
              <div className="text-gray-900">{formatDateTime(item.end_at)}</div>
            </div>
          )}
          {formatDateTime(item.deadline_at) && (
            <div>
              <div className="font-semibold text-gray-600">Deadline</div>
              <div className="text-gray-900">{formatDateTime(item.deadline_at)}</div>
            </div>
          )}
          {item.priority && (
            <div>
              <div className="font-semibold text-gray-600">Priority</div>
              <div className="text-gray-900">{item.priority}</div>
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.checklist && item.checklist.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Checklist
            </h2>
            <ul className="space-y-2">
              {item.checklist.map((check, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={check.checked} readOnly className="rounded" />
                  <span className={check.checked ? 'line-through text-gray-400' : 'text-gray-900'}>
                    {check.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
