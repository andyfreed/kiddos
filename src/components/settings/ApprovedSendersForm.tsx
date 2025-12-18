'use client'

import { useEffect, useState } from 'react'

type SenderEntry = { email: string; label?: string }

function isValidPattern(email: string) {
  const val = email.trim().toLowerCase()
  if (val.startsWith('*@')) {
    return /^\*@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(val)
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

export default function ApprovedSendersForm() {
  const [entries, setEntries] = useState<SenderEntry[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/settings/approved-senders')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        setEntries(data.approved_senders || [])
      })
      .catch(() => {
        if (!active) return
        setEntries([])
      })
    return () => {
      active = false
    }
  }, [])

  const addEntry = () => {
    const email = emailInput.trim().toLowerCase()
    if (!email || !isValidPattern(email)) {
      setError('Enter an email or *@example.com')
      return
    }
    if (entries.some((e) => e.email === email)) return
    setEntries((prev) => [...prev, { email, label: labelInput.trim() }])
    setEmailInput('')
    setLabelInput('')
    setError(null)
  }

  const removeEntry = (email: string) => {
    setEntries((prev) => prev.filter((e) => e.email !== email))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/approved-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_senders: entries }),
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
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_auto_auto] gap-2 items-center">
        <input
          type="text"
          placeholder="sender@example.com or *@school.org"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <input
          type="text"
          placeholder="Label (school, coach, etc.)"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <button
          type="button"
          onClick={addEntry}
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
        {entries.map((entry) => (
          <span key={entry.email} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
            {entry.label ? `${entry.label} — ` : ''}{entry.email}{' '}
            <button className="ml-1 text-blue-600" onClick={() => removeEntry(entry.email)}>
              ×
            </button>
          </span>
        ))}
        {!entries.length && <span className="text-sm text-gray-600">No approved senders yet.</span>}
      </div>
    </div>
  )
}
