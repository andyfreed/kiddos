'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ManualIngestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const payload = {
      subject: String(formData.get('subject') || ''),
      senderEmail: String(formData.get('senderEmail') || ''),
      senderName: formData.get('senderName') ? String(formData.get('senderName')) : undefined,
      body: String(formData.get('body') || ''),
      receivedAt: formData.get('receivedAt') ? new Date(String(formData.get('receivedAt'))).toISOString() : undefined,
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ingest/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to ingest message')
      }
      form.reset()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Paste an email</h2>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input name="subject" required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Received At</label>
          <input type="datetime-local" name="receivedAt" className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
          <input name="senderEmail" type="email" required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
          <input name="senderName" className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
        <textarea
          name="body"
          required
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>
    </form>
  )
}
