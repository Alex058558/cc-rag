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

- [`backend/agent/tools.py`](../../backend/agent/tools.py)：`retrieve_documents` tool 定義
- [`backend/agent/agent.py`](../../backend/agent/agent.py)：tool calling + context 組裝 + token stream
- [`backend/services/retrieval.py`](../../backend/services/retrieval.py)：Hybrid/Vector 檢索、heuristic rerank、dynamic top-k
- [`backend/routes/chat.py`](../../backend/routes/chat.py)：SSE 事件整合（`sources` + `token`）

### 前端

- [`frontend/src/components/chat/MessageList.tsx`](../../frontend/src/components/chat/MessageList.tsx)：解析 `[n]` 引用並渲染 citation button
- [`frontend/src/components/chat/Citation.tsx`](../../frontend/src/components/chat/Citation.tsx)：popover 顯示來源詳情
- [`frontend/src/components/ui/popover.tsx`](../../frontend/src/components/ui/popover.tsx)：基礎 popover 元件
- [`frontend/src/hooks/useChat.ts`](../../frontend/src/hooks/useChat.ts)：接收 `sources` 事件並綁定訊息

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

## 檢索品質提升（已完成）

初始版本使用固定 `top_k=5`，後續已升級為三段式檢索：

1. **Prefetch** — 先撈 15 筆候選（可配置 `rag_prefetch_k`）
2. **Heuristic Rerank** — 用關鍵詞覆蓋率 + 結構特徵重排，不依賴外部模型
3. **Dynamic Top-K** — 根據 similarity 分佈動態截斷，回傳 1~5 筆

所有參數可從 `.env` 調整，詳見 [rag/04-retrieval-tuning.md](../rag/04-retrieval-tuning.md)。

## Citation 持久化

引用來源存入 `messages.sources` JSONB 欄位（migration: [`supabase/migrations/005_message_sources.sql`](../../supabase/migrations/005_message_sources.sql)）。

切換對話再回來時，citation 仍可正常渲染，不會變成純文字。

## 目前限制與下一步

- 中文斷詞（jieba）可提升 heuristic rerank 效果
- 離線題組驗證尚未執行
- Hybrid 權重（RRF）仍需依資料集調參

## 完成判定

Phase 4 滿足以下條件：

- 聊天可引用已上傳文件
- 前端可檢視來源 chunk
- 回答與引用索引順序一致
- 無文件時能回退為一般聊天
- 引用來源切換對話後仍可顯示
- 檢索結果數量隨問題精確度動態調整
