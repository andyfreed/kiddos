'use client'

import { useEffect, useState } from 'react'

interface Status {
  connected: boolean
  expires_at?: string | null
}

export default function OutlookConnectPanel() {
  const [status, setStatus] = useState<Status>({ connected: false })
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    const res = await fetch('/api/ingest/outlook/status')
    if (res.ok) {
      const data = await res.json()
      setStatus(data)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleConnect = () => {
    window.location.href = '/api/ingest/outlook/connect'
  }

  const handleSync = async () => {
    setLoading(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/ingest/outlook/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setSyncResult(`Ingested ${data.ingestedCount}, skipped ${data.skippedCount}`)
      fetchStatus()
    } catch (err: any) {
      setSyncResult(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-sm">
          {status.connected
            ? `Connected. Token expires ${status.expires_at ? new Date(status.expires_at).toLocaleString() : 'soon'}.`
            : 'Not connected to Outlook.'}
        </div>
        <button
          type="button"
          onClick={handleConnect}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          {status.connected ? 'Reconnect' : 'Connect Outlook'}
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
      {syncResult && <div className="text-sm text-gray-700">{syncResult}</div>}
    </div>
  )
}
