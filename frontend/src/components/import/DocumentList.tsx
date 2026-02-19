import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Document } from '@/hooks/useDocuments'

const STATUS_STYLES: Record<Document['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  documents: Document[]
  onDelete: (id: string) => void
}

export default function DocumentList({ documents, onDelete }: Props) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No documents imported yet.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Name</th>
            <th className="px-4 py-2.5 text-left font-medium">Size</th>
            <th className="px-4 py-2.5 text-left font-medium">Chunks</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Added</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
              <td className="max-w-[240px] truncate px-4 py-3 font-medium" title={doc.filename}>
                {doc.filename}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.file_size)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {doc.status === 'completed' ? doc.chunk_count : '—'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(doc.id)}
                  disabled={doc.status === 'processing'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
