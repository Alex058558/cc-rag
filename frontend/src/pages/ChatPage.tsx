import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'
import ConversationSidebar from '@/components/chat/ConversationSidebar'
import MessageList from '@/components/chat/MessageList'
import MessageInput from '@/components/chat/MessageInput'

export default function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { conversations, refresh, create, remove } = useConversations()
  const { messages, streaming, loadMessages, send, stop, clear } = useChat(activeId)

  // 追蹤 streaming 狀態，避免 streaming 期間 loadMessages 覆蓋前端訊息
  const streamingRef = useRef(false)
  useEffect(() => {
    streamingRef.current = streaming
  }, [streaming])

  // 只在 activeId 改變時載入，且不在 streaming 期間
  useEffect(() => {
    // streaming 期間不要重新載入（會覆蓋前端正在顯示的訊息）
    if (streamingRef.current) {
      return
    }

    if (activeId) {
      loadMessages(activeId)
    } else {
      clear()
    }
  }, [activeId, loadMessages, clear])

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const handleCreate = useCallback(async () => {
    setActiveId(null)
    clear()
  }, [clear])

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id)
      if (id === activeId) {
        setActiveId(null)
        clear()
      }
    },
    [remove, activeId, clear],
  )

  const handleSend = useCallback(
    (message: string) => {
      send(message, activeId, (newId) => {
        if (!activeId) {
          setActiveId(newId)
        }
        refresh()
      })
    },
    [send, activeId, refresh],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-64 border-r bg-muted/30">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>
      <div className="flex flex-1 flex-col">
        <MessageList messages={messages} streaming={streaming} />
        <MessageInput
          onSend={handleSend}
          onStop={stop}
          streaming={streaming}
        />
      </div>
    </div>
  )
}
