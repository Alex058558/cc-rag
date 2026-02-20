# RAG 名詞表

這份文件把 Phase 1-4 常見術語集中整理，遇到不懂的詞可先回來查。

建議用法：看到陌生名詞先查一次，再回到教學文件讀，理解速度會快很多。

## A

### Agent

在本專案中指「可呼叫工具再回答」的聊天邏輯層，不是單純對話模型。

白話就是：它不只是會聊天，還會先去做事（例如檢索）再回話。

### API

系統之間溝通的介面。前端透過 API 呼叫後端，後端再呼叫資料庫或模型。

## C

### Chunk

長文件切出的片段，是檢索與引用的最小單位。

### Citation Persistence

引用來源持久化。把檢索到的 sources 存進 `messages.sources` JSONB 欄位，這樣切換對話再回來時 citation 仍可正常顯示。對應 migration: `005_message_sources.sql`。

### Cosine Similarity

向量相似度計算方式，值越高通常表示語意越接近。

## D

### Dynamic Top-K

不固定取幾筆檢索結果，而是根據候選的 similarity 分佈動態決定。如果前幾名分數很集中、後面突然掉很多，就自動截斷。避免問題單純時帶入太多噪音。

設定參數：`rag_top_k_min`（最少取幾筆）、`rag_top_k_max`（最多取幾筆）、`rag_similarity_drop_ratio`（截斷比例）。

## E

### Embedding

把文字轉成向量，讓資料庫能做語意搜尋。

## H

### Heuristic Rerank

不用外部模型的二次排序方式。本專案的 heuristic rerank 用三個因子重新打分：

- vector similarity（70%）— 原本的向量相似度
- keyword coverage（25%）— query 關鍵詞在 chunk 中出現的比例
- structure bonus（5%）— chunk 開頭是 markdown heading 的話加分

和模型 rerank（如 Cohere Rerank）相比，零額外成本、零延遲，但精度有限。

### Hybrid Search

同時使用 keyword 搜尋與向量搜尋，再合併結果。

## J

### JWT

登入後的身份 token，後端用它辨識呼叫者。

## M

### Migration

資料庫版本變更檔，確保每個環境 schema 一致。

## P

### Prefetch

在做 rerank 和最終裁切之前，先用向量檢索多撈一批候選（例如 15 筆）。給後續步驟更多素材可選，提升最終結果品質。

設定參數：`rag_prefetch_k`（預設 15）。

### pgvector

PostgreSQL extension，提供向量欄位與向量索引能力。

### Prompt

傳給 LLM 的輸入內容，包含系統指令、歷史對話、檢索片段。

## R

### RAG

Retrieval-Augmented Generation。先檢索再生成，降低胡亂回答機率。

### Rerank

二次排序。先撈候選，再重新排序，讓最相關內容排前面。

可以理解成海選後再決賽，避免第一輪把看起來像、但其實不夠準的內容排太前面。

常見做法：
- **Heuristic rerank** — 用關鍵詞覆蓋、結構特徵等規則打分（本專案目前用這個）
- **Model rerank** — 用 cross-encoder 模型（如 Cohere Rerank）做精排，品質更好但有外部依賴

### RLS

Row-Level Security。資料庫行級權限控制，保護多租戶資料。

## S

### SSE

Server-Sent Events，伺服器單向持續推送資料給前端，常用於串流回覆。

### Similarity Threshold

相似度門檻，低於門檻的候選會被過濾。

## T

### Top-K

檢索要取前幾個結果。K 越大通常召回越高，但噪音也可能增加。

常見問題不是「要不要調 K」，而是「不同題型該用哪個 K」。

### Tool Calling

模型先決定是否呼叫工具（例如 `retrieve_documents`）再回答。
