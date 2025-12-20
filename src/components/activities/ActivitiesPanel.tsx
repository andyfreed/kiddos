'use client'

import { useEffect, useMemo, useState } from 'react'

type Activity = {
  id: string
  name: string
  notes: string | null
}

export default function ActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const sorted = useMemo(() => {
    return [...activities].sort((a, b) => a.name.localeCompare(b.name))
  }, [activities])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/activities', { method: 'GET' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load activities')
      setActivities(data.activities || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (a: Activity) => {
    setEditingId(a.id)
    setEditName(a.name)
    setEditNotes(a.notes || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditNotes('')
  }

  const create = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes: newNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setNewName('')
      setNewNotes('')
      await load()
    } catch (err: any) {
      setError(err.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activities/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes: editNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      cancelEdit()
      await load()
    } catch (err: any) {
      setError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    // Simple confirm to avoid accidental taps on mobile
    if (!confirm('Delete this activity? This does not delete any items, but items may lose their activity link.')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      if (editingId === id) cancelEdit()
      await load()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Activities</h1>
          <p className="text-gray-700">
            Activities are reusable templates (e.g. &quot;Soccer practice&quot;) that the AI can match and link to extracted items.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Create activity</h2>
          <button
            type="button"
            onClick={create}
            disabled={saving || !newName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add'}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Soccer practice"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Coach, field, gear, etc."
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your activities</h2>
          <div className="text-sm text-gray-600">{activities.length} total</div>
        </div>

        {loading ? (
          <div className="p-4 text-gray-700">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="p-4 text-gray-700">No activities yet.</div>
        ) : (
          <div className="divide-y">
            {sorted.map((a) => {
              const editing = editingId === a.id
              return (
                <div key={a.id} className="p-4">
                  {!editing ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{a.name}</div>
                        {a.notes ? <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{a.notes}</div> : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(a.id)}
                          className="px-3 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving || !editName.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

