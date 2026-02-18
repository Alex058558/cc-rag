import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/hooks/useChat'

interface Props {
  messages: Message[]
  streaming: boolean
}

export default function MessageList({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Bot className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Send a message to begin chatting with AI</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-3 max-w-3xl mx-auto">
          <div
            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {msg.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none">
            {msg.role === 'assistant' && !msg.content && streaming ? (
              <span className="inline-block h-4 w-2 animate-pulse bg-foreground/50 rounded" />
            ) : (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
