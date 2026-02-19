# SSE 串流回應（含引用來源事件）

## 什麼是 SSE？

**Server-Sent Events** - 伺服器主動推送資料給客戶端。

## 比喻

- **一般 API**：打電話給客服，對方接起來說完才掛斷
- **SSE**：訂閱 YouTube 通知，有新影片自動推給你

## 為什麼聊天要用 SSE？

LLM 生成文字需要時間，如果等全部生成完再回傳：
- 使用者要等很久
- 沒有「打字中」的感覺

用 SSE 可以**一個字一個字**顯示，像真的在對話一樣！

## CC-RAG 的實作

### 後端（FastAPI）

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

@router.post("/api/chat")
async def chat(request: ChatRequest):
    async def generate():
        yield f'data: {{"conversation_id": "..."}}\n\n'

        async for event in stream_agent_response(...):
            if event["type"] == "sources":
                yield f'data: {{"sources": [...]}}\n\n'
            elif event["type"] == "token":
                yield f'data: {{"token": "{event["token"]}"}}\n\n'

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 傳輸格式（目前版本）

```
data: {"conversation_id": "..."}
data: {"sources": [{...}, {...}]}
data: {"token": "你"}
data: {"token": "好"}
data: [DONE]
```

### 前端（React）

```typescript
const res = await fetch('/api/chat', {...})
const reader = res.body.getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = new TextDecoder().decode(value)
  // 解析 data: {...} 格式
  // 逐字顯示到畫面上
}
```

## 流程圖

```
使用者發送訊息
        ↓
後端建立 SSE 串流
        ↓
一邊呼叫 LLM
  ↓              ↓
LLM 回傳    前端即時顯示
        ↓              ↓
        └────→ yield →┘
              (一個字一個字)
```

## 為什麼這裡不用 WebSocket？

目前聊天是「前端送一次，後端持續回」，屬於典型單向串流。

- SSE：語意簡單、實作成本低、和 HTTP 相容好
- WebSocket：雙向更靈活，但在這個場景較重

## 優點

1. **即時反饋** - 看到一個一個字出現
2. **減少等待感** - 不需要等全部生成
3. **實作簡單** - 比 WebSocket 簡單

## 限制

1. **單向** - 只有伺服器推給客戶端
2. **重連策略要自己處理** - 斷線後需重新請求

## 在專案中的位置

- 後端：`backend/routes/chat.py` - `/api/chat` endpoint
- 後端：`backend/agent/agent.py` - 產生 `sources` / `token` 事件
- 前端：`frontend/src/hooks/useChat.ts` - 解析 SSE 並更新訊息與來源
