# Phase 4 詳解：RAG 檢索與聊天整合

## 目標

簡單講，Phase 4 才是 RAG 真正「有靈魂」的階段：不是只有聊天，而是會帶證據聊天。

Phase 4 是把「文件知識」接進聊天：

- 使用者提問
- Agent 決定是否檢索
- 回傳相關 chunk 當上下文
- LLM 產生附引用標記的回答
- 前端可點 `[1]` 查看來源片段

## 功能清單（對應實作）

### 後端

- `backend/agent/tools.py`：`retrieve_documents` tool 定義
- `backend/agent/agent.py`：tool calling + context 組裝 + token stream
- `backend/services/retrieval.py`：向量檢索與相似度過濾
- `backend/routes/chat.py`：SSE 事件整合（`sources` + `token`）

### 前端

- `frontend/src/components/chat/MessageList.tsx`：解析 `[n]` 引用並渲染 citation button
- `frontend/src/components/chat/Citation.tsx`：popover 顯示來源詳情
- `frontend/src/components/ui/popover.tsx`：基礎 popover 元件
- `frontend/src/hooks/useChat.ts`：接收 `sources` 事件並綁定訊息

## 關鍵名詞

> 完整術語定義見 [RAG 名詞表](07-rag-glossary.md)，RAG 概念入門見 [rag/01-concept.md](../rag/01-concept.md)

- **Tool Calling**：讓 LLM 先呼叫工具取資料再回答。想像成「等我一下，我去翻資料」。
- **Retrieval**：從 `document_chunks` 中找出與 query 最相關的段落。
- **Citation**：回答中的 `[1]`、`[2]`，對應檢索結果索引。
- **Similarity Threshold**：最小相似度門檻，太低什麼都像，太高又可能漏重要段落。

## 事件流（SSE）

```text
data: {"conversation_id": "..."}
data: {"sources": [...]}
data: {"token": "..."}
data: {"token": "..."}
data: [DONE]
```

前端會先收到 `sources`，再邊收 token 邊顯示回答文字。

這也是為什麼有時你會先看到引用資料，再看到完整回答，這是預期行為。

## 引用渲染的重點

目前前端引用顯示已修正兩件事：

- 避免 `[1]` 文字與 citation 元件重複顯示
- popover 不再硬截斷 chunk，改為可捲動完整內容

此外，也加上 `Referenced answer text`，幫助理解回答片段與來源 chunk 的對應。

## 目前限制與下一步

目前是「可用版」——固定 `top_k=5`、無 rerank、無 hybrid search。還有優化空間。

下一步的檢索升級策略（動態 Top-K、Rerank、品質觀測）見 [rag/04-retrieval-tuning.md](../rag/04-retrieval-tuning.md)。

## 完成判定

Phase 4 現階段可用版完成時，至少要滿足：

- 聊天可引用已上傳文件
- 前端可檢視來源 chunk
- 回答與引用索引順序一致
- 無文件時能回退為一般聊天
