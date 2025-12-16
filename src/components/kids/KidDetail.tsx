'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Kid } from '@/core/models/kid'
import KidForm from './KidForm'

interface KidDetailProps {
  kid: Kid
}

export default function KidDetail({ kid }: KidDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${kid.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/kids/${kid.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete kid')
      }

      router.push('/kids')
      router.refresh()
    } catch (error) {
      alert('Failed to delete kid')
    }
  }

  if (isEditing) {
    return <KidForm kid={kid} onCancel={() => setIsEditing(false)} />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{kid.name}</h1>
        <div className="space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <dl className="space-y-4">
          {kid.grade && (
            <div>
              <dt className="text-sm font-medium text-gray-700">Grade</dt>
              <dd className="mt-1 text-sm text-gray-900">{kid.grade}</dd>
            </div>
          )}
          {kid.birthday && (
            <div>
              <dt className="text-sm font-medium text-gray-700">Birthday</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(kid.birthday).toLocaleDateString()}
              </dd>
            </div>
          )}
          {kid.notes && (
            <div>
              <dt className="text-sm font-medium text-gray-700">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{kid.notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
