'use client'

import { useEffect, useState } from 'react'

interface Suggestion {
  id: string
  title: string
  description: string | null
  type: 'task' | 'event' | 'deadline'
  start_at: string | null
  end_at: string | null
  deadline_at: string | null
  confidence: number
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suggestions/list')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load suggestions')
      setSuggestions(data.suggestions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (id: string) => {
    setApproving(id)
    setError(null)
    try {
      const res = await fetch('/api/suggestions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionIds: [id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approve failed')
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Suggestions</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : suggestions.length === 0 ? (
        <div className="text-gray-700">No suggestions yet. Run AI extract from an Inbox message.</div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-4 bg-white flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-gray-600">{s.type}</div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                {s.description && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{s.description}</p>}
                <div className="text-xs text-gray-500 mt-1">Confidence {Math.round(s.confidence * 100)}%</div>
              </div>
              <button
                onClick={() => approve(s.id)}
                disabled={approving === s.id}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {approving === s.id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
