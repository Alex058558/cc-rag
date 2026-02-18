import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export function useChat(conversationId: string | null) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const token = session?.access_token

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!token) return
      setLoadingHistory(true)
      try {
        const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setMessages(await res.json())
      } finally {
        setLoadingHistory(false)
      }
    },
    [token],
  )

  const send = useCallback(
    async (
      message: string,
      convId: string | null,
      onConversationCreated?: (id: string) => void,
    ) => {
      if (!token || streaming) return

      setStreaming(true)
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', created_at: new Date().toISOString() },
      ])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id: convId,
            message,
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') continue

            try {
              const data = JSON.parse(payload)
              if (data.conversation_id && !convId) {
                onConversationCreated?.(data.conversation_id)
              }
              if (data.token) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + data.token } : m,
                  ),
                )
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'An error occurred. Please try again.' }
                : m,
            ),
          )
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [token, streaming],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, streaming, loadingHistory, loadMessages, send, stop, clear }
}
