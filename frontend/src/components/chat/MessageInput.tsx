import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onSend: (message: string) => void
  onStop: () => void
  streaming: boolean
  disabled?: boolean
}

export default function MessageInput({ onSend, onStop, streaming, disabled }: Props) {
  const [value, setValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!streaming) textareaRef.current?.focus()
  }, [streaming])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }, [value])

  const handleSubmit = () => {
    if (isComposing) return  // IME 組合中不要發送
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    setValue('')
    onSend(trimmed)
  }

  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = () => {
    setIsComposing(false)
    // IME 組合結束後自動發送（可選）
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Send a message..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        {streaming ? (
          <Button size="icon" variant="destructive" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
