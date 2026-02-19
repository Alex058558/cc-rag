import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED = '.pdf,.docx,.txt,.md,.html'

interface Props {
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}

export default function FileDropZone({ onUpload, uploading }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await onUpload(file)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onUpload(file)
      e.target.value = ''
    }
  }

  return (
    <div
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors select-none',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        uploading && 'pointer-events-none opacity-60',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleChange}
      />
      <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium">
        {uploading ? 'Uploading...' : 'Drop file here or click to upload'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, MD, HTML</p>
    </div>
  )
}
