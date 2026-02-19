import type { Source } from '@/hooks/useChat'

interface Props {
  source: Source
}

export default function SourceCard({ source }: Props) {
  const pct = Math.round(source.similarity * 100)
  const preview =
    source.content.length > 200 ? source.content.slice(0, 200) + '…' : source.content

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate text-foreground">{source.filename}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <p className="text-muted-foreground leading-relaxed line-clamp-3">{preview}</p>
    </div>
  )
}
