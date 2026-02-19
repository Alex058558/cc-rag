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

### Tool Calling

讓 LLM 不只「說話」，還能先呼叫工具取資料，再回答。

可以把它想成模型先說：「等我一下，我去翻資料」，然後再回來答你。

### Retrieval

從 `document_chunks` 中找出與 query 最相關的段落。

### Citation

回答中的 `[1]`、`[2]`，對應到檢索結果清單索引。

### Similarity Threshold

最小相似度門檻。低於門檻的 chunk 直接忽略，避免噪音。

這個門檻太低會變成什麼都像，太高又可能漏掉邊緣但重要的段落。

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

## 目前限制

- 檢索目前採固定 `top_k=5`
- 尚未加入 rerank
- 尚未做 hybrid search（keyword + vector）

所以目前的品質屬於「可用版」，但還有優化空間，不是最終型態。

## 下一步（已規劃）

詳細策略見 `/.tutorial/rag/04-retrieval-tuning.md`，重點為：

1. 可配置動態 Top-K
2. 候選先抓後排（prefetch + rerank）
3. 建立檢索品質觀測

## 完成判定

Phase 4 現階段可用版完成時，至少要滿足：

- 聊天可引用已上傳文件
- 前端可檢視來源 chunk
- 回答與引用索引順序一致
- 無文件時能回退為一般聊天
