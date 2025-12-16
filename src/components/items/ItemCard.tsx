'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FamilyItem } from '@/core/models/familyItem'
import { format } from 'date-fns'

interface ItemCardProps {
  item: FamilyItem
}

export default function ItemCard({ item }: ItemCardProps) {
  const [status, setStatus] = useState(item.status)

  const handleStatusChange = async (newStatus: FamilyItem['status']) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      setStatus(newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusColor = (s: string) => {
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

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'event':
        return '📅'
      case 'deadline':
        return '⏰'
      default:
        return '✓'
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getTypeIcon(item.type)}</span>
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          {item.description && (
            <p className="text-gray-700 text-sm mb-2">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {item.deadline_at && (
              <span>Due: {format(new Date(item.deadline_at), 'MMM d, yyyy h:mm a')}</span>
            )}
            {item.start_at && (
              <span>Start: {format(new Date(item.start_at), 'MMM d, yyyy h:mm a')}</span>
            )}
            {item.end_at && (
              <span>End: {format(new Date(item.end_at), 'MMM d, yyyy h:mm a')}</span>
            )}
          </div>

          {item.checklist && item.checklist.length > 0 && (
            <div className="mt-2">
              <ul className="text-sm space-y-1">
                {item.checklist.map((check, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={check.checked}
                      readOnly
                      className="rounded"
                    />
                    <span className={check.checked ? 'line-through text-gray-400' : ''}>
                      {check.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ml-4 flex flex-col gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as FamilyItem['status'])}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="snoozed">Snoozed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <Link
            href={`/items/${item.id}`}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}
