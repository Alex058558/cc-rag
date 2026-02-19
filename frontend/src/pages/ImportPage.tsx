import { useState } from 'react'
import FileDropZone from '@/components/import/FileDropZone'
import DocumentList from '@/components/import/DocumentList'
import ProcessingStatus from '@/components/import/ProcessingStatus'
import { useDocuments } from '@/hooks/useDocuments'

export default function ImportPage() {
  const { documents, loading, uploading, error, upload, deleteDoc } = useDocuments()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploadError(null)
    try {
      await upload(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-lg font-semibold">Import Documents</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upload files to build your knowledge base. Supported: PDF, DOCX, TXT, MD, HTML.
        </p>
      </div>

      <FileDropZone onUpload={handleUpload} uploading={uploading} />

      {(uploadError || error) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {uploadError ?? error}
        </p>
      )}

      <ProcessingStatus documents={documents} />

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DocumentList documents={documents} onDelete={deleteDoc} />
      )}
    </div>
  )
}
