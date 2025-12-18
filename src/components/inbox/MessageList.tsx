'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import type { SourceMessage } from '@/core/models/sourceMessage'

interface MessageListProps {
  messages: SourceMessage[]
}

export default function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return <div className="text-gray-600">No messages yet. Paste one to get started.</div>
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <Link
          key={msg.id}
          href={`/inbox/${msg.id}`}
          className="block border border-gray-200 bg-white rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-gray-600">
              {msg.sender_name ? `${msg.sender_name} <${msg.sender_email}>` : msg.sender_email}
            </div>
            <div className="text-xs text-gray-500">
              {msg.received_at ? format(new Date(msg.received_at), 'MMM d, yyyy h:mm a') : '—'}
            </div>
          </div>
          <div className="mt-1 font-semibold">{msg.subject}</div>
          <div className="mt-1 text-sm text-gray-700 line-clamp-2">{msg.body_text}</div>
        </Link>
      ))}
    </div>
  )
}
