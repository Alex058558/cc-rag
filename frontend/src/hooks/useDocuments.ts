import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE, apiFetch } from '@/lib/api'

export interface Document {
  id: string
  filename: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count: number
  created_at: string
}

export function useDocuments() {
  const { session } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const res = await apiFetch('/api/documents', {}, session.access_token)
      setDocuments(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Poll while any document is still being processed
  useEffect(() => {
    const hasActive = documents.some(
      (d) => d.status === 'processing' || d.status === 'pending',
    )
    if (!hasActive) return
    const timer = setInterval(fetchDocuments, 3000)
    return () => clearInterval(timer)
  }, [documents, fetchDocuments])

  const upload = async (file: File) => {
    if (!session?.access_token) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      const doc: Document = await res.json()
      // Deduplicate: replace if same id, otherwise prepend
      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      throw err
    } finally {
      setUploading(false)
    }
  }

  const deleteDoc = async (id: string) => {
    if (!session?.access_token) return
    try {
      await apiFetch(`/api/documents/${id}`, { method: 'DELETE' }, session.access_token)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return { documents, loading, uploading, error, upload, deleteDoc, refetch: fetchDocuments }
}
