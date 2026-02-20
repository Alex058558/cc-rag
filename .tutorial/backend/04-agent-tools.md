# Agent 與 Tool Calling

## 概述

Phase 4 加入了 Agent 層，讓 LLM 不只是回話，還會先「查資料」再回答。

這裡的 Agent 不是自主決策的 AI Agent，而是一個兩階段呼叫流程：先讓模型決定要不要用工具，用完再生成最終回覆。

## 檔案對應

- [`backend/agent/tools.py`](../../backend/agent/tools.py)：工具定義
- [`backend/agent/agent.py`](../../backend/agent/agent.py)：Agent 流程控制
- [`backend/services/retrieval.py`](../../backend/services/retrieval.py)：實際執行檢索
- [`backend/services/embedding.py`](../../backend/services/embedding.py)：query 向量化

## Tool 定義

```python
RETRIEVE_TOOL = {
    "type": "function",
    "function": {
        "name": "retrieve_documents",
        "description": "Search the user's knowledge base...",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A search query...",
                }
            },
            "required": ["query"],
        },
    },
}
```

這是 OpenAI function calling 的標準格式。Gemini 透過 OpenAI-compatible API 也支援。

模型看到這個定義後，會自己決定 `query` 要填什麼。

## 兩階段流程

```text
使用者問問題
    |
    v
[第一階段] 非串流呼叫 (tool calling round)
    |-- 模型決定是否呼叫 retrieve_documents
    |-- 如果呼叫 -> 執行檢索 -> 把結果塞回 messages
    |-- 如果不呼叫 -> 直接用第一階段回覆
    |
    v
[第二階段] 串流呼叫 (final streaming)
    |-- 帶上檢索結果的 messages
    |-- 串流生成附引用的回答
```

### 為什麼分兩階段

Tool calling 需要看到完整的模型回覆才能決定下一步，所以第一階段不能串流。

但使用者看到的最終回答需要即時顯示，所以第二階段用串流。

## System Prompt 的切換

```python
use_rag = has_completed_documents(admin_db, user_id)

messages = [{"role": "system", "content": _RAG_SYSTEM if use_rag else _PLAIN_SYSTEM}]
```

如果使用者沒有上傳任何文件，就不開啟 RAG 模式，避免不必要的 tool calling round-trip。

`has_completed_documents()` 檢查該使用者是否有至少一份 `status=completed` 的文件。

## Context 組裝

檢索完成後，把 chunk 內容連同索引編號塞進 `tool` role 的 message：

```python
tool_content = json.dumps([
    {"index": i + 1, "filename": c["filename"], "content": c["content"]}
    for i, c in enumerate(chunks)
])

messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": tool_content})
```

模型看到 `index: 1` 對應哪段 chunk，就會在回答中用 `[1]` 標記。

## SSE 事件順序

Agent 產出的事件會被 [`backend/routes/chat.py`](../../backend/routes/chat.py) 轉成 SSE：

```text
data: {"conversation_id": "..."}    <- 建立/沿用對話
data: {"sources": [...]}            <- 檢索到的 chunk
data: {"token": "根"}               <- 串流 token
data: {"token": "據"}
data: {"token": "研究[1]"}
data: [DONE]
```

前端先收到 `sources` 建立來源清單，再逐字收 token 並即時渲染引用。

## tool_choice 策略

目前使用強制呼叫：

```python
tool_choice={"type": "function", "function": {"name": "retrieve_documents"}}
```

這表示只要有文件，每次聊天都會執行檢索。

未來可改為 `tool_choice="auto"` 讓模型自己判斷是否需要檢索，但需要確保模型判斷的準確度夠高。

## 與其他元件的關係

```text
routes/chat.py
    -> agent/agent.py (stream_agent_response)
        -> agent/tools.py (RETRIEVE_TOOL 定義)
        -> services/embedding.py (query 向量化)
        -> services/retrieval.py (向量檢索 + 相似度篩選)
    -> SSE 回傳前端
```
