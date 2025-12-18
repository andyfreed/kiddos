'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import type { SourceMessage } from '@/core/models/sourceMessage'

interface MessageDetailProps {
  message: SourceMessage
}

export default function MessageDetail({ message }: MessageDetailProps) {
  const router = useRouter()
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const runExtraction = async () => {
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/extract/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceMessageId: message.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed')
      }
      router.push('/suggestions')
      router.refresh()
    } catch (err: any) {
      setExtractError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-600">
            From:{' '}
            {message.sender_name ? `${message.sender_name} <${message.sender_email}>` : message.sender_email}
          </div>
          <div className="text-xs text-gray-500">
            {message.received_at ? format(new Date(message.received_at), 'MMM d, yyyy h:mm a') : '—'}
          </div>
          <h1 className="text-2xl font-semibold mt-2">{message.subject}</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Back
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runExtraction}
          disabled={extracting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {extracting ? 'Extracting...' : 'Run AI Extract'}
        </button>
        {extractError && <div className="text-sm text-red-600">{extractError}</div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-gray-900">
        {message.body_text}
      </div>
    </div>
  )
}
