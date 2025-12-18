'use client'

import { useState } from 'react'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'bot'; text: string }>>([
    { from: 'bot', text: 'Hi! Ask me to create, update, or organize tasks. More tools coming soon.' },
  ])
  const [pendingConfirm, setPendingConfirm] = useState<{
    token: string
    description: string
    riskLevel: 'low' | 'medium' | 'high'
  } | null>(null)
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((prev) => [...prev, { from: 'user', text }])
    setSending(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Chat failed')
      }
      setMessages((prev) => [...prev, { from: 'bot', text: data.response || '' }])
      if (data.requiresConfirm && data.confirmToken && data.pendingAction) {
        setPendingConfirm({
          token: data.confirmToken,
          description: data.pendingAction.description,
          riskLevel: data.pendingAction.riskLevel,
        })
      } else {
        setPendingConfirm(null)
      }
    } finally {
      setSending(false)
    }
  }

  const confirm = async () => {
    if (!pendingConfirm) return
    setSending(true)
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmToken: pendingConfirm.token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Confirm failed')
      setMessages((prev) => [...prev, { from: 'bot', text: data.response || 'Done.' }])
      setPendingConfirm(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
          aria-label="Open chat"
        >
          Chat
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
            <div>
              <div className="text-sm font-semibold text-gray-900">Kiddos Assistant</div>
              <div className="text-xs text-gray-600">Ask me to organize your tasks.</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`text-sm max-w-[90%] ${
                  m.from === 'user'
                    ? 'ml-auto bg-blue-50 text-blue-900 rounded-lg px-3 py-2'
                    : 'bg-gray-100 text-gray-900 rounded-lg px-3 py-2'
                }`}
              >
                {m.text}
              </div>
            ))}
            {pendingConfirm && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 text-sm text-yellow-900">
                <div className="font-semibold">Confirm action</div>
                <div className="mt-1">{pendingConfirm.description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={sending}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingConfirm(null)}
                    className="px-3 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-md hover:bg-yellow-100 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-3 py-2 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask me to add or update tasks..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
