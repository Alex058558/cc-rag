import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/api'

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function useConversations() {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const token = session?.access_token

  const refresh = useCallback(async () => {
    if (!token) return
    const res = await apiFetch('/api/conversations', {}, token)
    setConversations(await res.json())
    setLoading(false)
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async () => {
    if (!token) return null
    const res = await apiFetch('/api/conversations', { method: 'POST' }, token)
    const conv: Conversation = await res.json()
    setConversations((prev) => [conv, ...prev])
    return conv
  }, [token])

  const remove = useCallback(
    async (id: string) => {
      if (!token) return
      await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' }, token)
      setConversations((prev) => prev.filter((c) => c.id !== id))
    },
    [token],
  )

  return { conversations, loading, refresh, create, remove }
}
