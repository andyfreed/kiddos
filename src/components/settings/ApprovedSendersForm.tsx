'use client'

import { useEffect, useState } from 'react'

export default function ApprovedSendersForm() {
  const [emails, setEmails] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/settings/approved-senders')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        setEmails(data.approved_senders || [])
      })
      .catch(() => {
        if (!active) return
        setEmails([])
      })
    return () => {
      active = false
    }
  }, [])

  const addEmail = () => {
    const value = input.trim().toLowerCase()
    if (!value || emails.includes(value)) return
    setEmails((prev) => [...prev, value])
    setInput('')
  }

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/approved-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_senders: emails }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="sender@example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
        />
        <button
          type="button"
          onClick={addEmail}
          className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Add
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {emails.map((email) => (
          <span key={email} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
            {email}{' '}
            <button className="ml-1 text-blue-600" onClick={() => removeEmail(email)}>
              ×
            </button>
          </span>
        ))}
        {!emails.length && <span className="text-sm text-gray-600">No approved senders yet.</span>}
      </div>
    </div>
  )
}
