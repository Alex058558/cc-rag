import { cloneElement, isValidElement, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot } from 'lucide-react'
import type { Message, Source } from '@/hooks/useChat'
import Citation from './Citation'

interface Props {
  messages: Message[]
  streaming: boolean
}

const citationPattern = /\[(\d+)\]/g

type CitationSegment =
  | { type: 'text'; value: string }
  | {
      type: 'citation'
      sourceIndex: number
      marker: string
      relationText: string
    }

function getRelationText(textBeforeCitation: string): string {
  const normalized = textBeforeCitation.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const sentences = normalized.split(/(?<=[.!?。！？])\s+/)
  const nearestSentence = sentences[sentences.length - 1] || normalized

  return nearestSentence.length > 90
    ? `…${nearestSentence.slice(-90)}`
    : nearestSentence
}

function splitCitationSegments(text: string): CitationSegment[] {
  const segments: CitationSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  citationPattern.lastIndex = 0

  while ((match = citationPattern.exec(text)) !== null) {
    const matchStart = match.index
    const matchEnd = matchStart + match[0].length

    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, matchStart),
      })
    }

    segments.push({
      type: 'citation',
      sourceIndex: Number(match[1]) - 1,
      marker: match[0],
      relationText: getRelationText(text.slice(lastIndex, matchStart)),
    })

    lastIndex = matchEnd
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  if (segments.length === 0) {
    return [{ type: 'text', value: text }]
  }

  return segments
}

function renderTextWithCitations(text: string, sources: Source[]): ReactNode {
  const segments = splitCitationSegments(text)

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`text-${index}`}>{segment.value}</span>
        }

        if (segment.sourceIndex < 0 || segment.sourceIndex >= sources.length) {
          return <span key={`citation-${index}`}>{segment.marker}</span>
        }

        return (
          <Citation
            key={`citation-${index}`}
            source={sources[segment.sourceIndex]}
            index={segment.sourceIndex}
            relationText={segment.relationText}
          />
        )
      })}
    </>
  )
}

function processAllChildren(children: ReactNode, sources: Source[]): ReactNode {
  if (!children) return children

  if (typeof children === 'string') {
    return renderTextWithCitations(children, sources)
  }

  if (Array.isArray(children)) {
    return children.map((child) => processAllChildren(child, sources))
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    const nextChildren = children.props.children
      ? processAllChildren(children.props.children, sources)
      : children.props.children

    return cloneElement(children, { children: nextChildren })
  }

  return children
}

function CitationText({
  content,
  sources,
}: {
  content: string
  sources: Source[] | undefined
}) {
  if (!sources || sources.length === 0) {
    return <ReactMarkdown>{content}</ReactMarkdown>
  }

  // Use components prop to intercept all elements
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p>{processAllChildren(children, sources)}</p>
        ),
        li: ({ children }) => (
          <li>{processAllChildren(children, sources)}</li>
        ),
        h1: ({ children }) => (
          <h1>{processAllChildren(children, sources)}</h1>
        ),
        h2: ({ children }) => (
          <h2>{processAllChildren(children, sources)}</h2>
        ),
        h3: ({ children }) => (
          <h3>{processAllChildren(children, sources)}</h3>
        ),
        strong: ({ children }) => (
          <strong>{processAllChildren(children, sources)}</strong>
        ),
        em: ({ children }) => (
          <em>{processAllChildren(children, sources)}</em>
        ),
        span: ({ children }) => (
          <span>{processAllChildren(children, sources)}</span>
        ),
        td: ({ children }) => (
          <td>{processAllChildren(children, sources)}</td>
        ),
        th: ({ children }) => (
          <th>{processAllChildren(children, sources)}</th>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
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
        <div key={msg.id} className="max-w-3xl mx-auto space-y-3">
          <div className="flex gap-3">
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
              ) : msg.role === 'assistant' && msg.sources ? (
                <CitationText content={msg.content} sources={msg.sources} />
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
