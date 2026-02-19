import type { Document } from '@/hooks/useDocuments'

interface Props {
  documents: Document[]
}

export default function ProcessingStatus({ documents }: Props) {
  const active = documents.filter(
    (d) => d.status === 'processing' || d.status === 'pending',
  )
  if (active.length === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      Processing {active.length} document{active.length > 1 ? 's' : ''}...
    </div>
  )
}
