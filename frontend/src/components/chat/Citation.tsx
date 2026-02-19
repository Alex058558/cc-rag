import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Source } from '@/hooks/useChat'

interface CitationProps {
  source: Source
  index: number
  relationText?: string
}

function SourcePopover({
  source,
  relationText,
}: {
  source: Source
  relationText?: string
}) {
  const pct = Math.round(source.similarity * 100)

  return (
    <div className="text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate text-foreground">{source.filename}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="text-muted-foreground">Chunk #{source.chunk_index + 1}</div>
      {relationText ? (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Referenced answer text
          </div>
          <p className="text-foreground leading-relaxed">{relationText}</p>
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Source chunk
        </div>
        <p className="max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed text-muted-foreground">
          {source.content}
        </p>
      </div>
    </div>
  )
}

export default function Citation({ source, index, relationText }: CitationProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={`View source ${index + 1}`}
        >
          [{index + 1}]
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80">
        <SourcePopover source={source} relationText={relationText} />
      </PopoverContent>
    </Popover>
  )
}
