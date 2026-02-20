# RAG 名詞表

這份文件整理 CC-RAG 常見術語，重點放在「看得懂專案」與「能做調參決策」。

建議用法：

1. 先查名詞，掌握大方向
2. 再回到對應教學看完整流程
3. 最後對照專案檔案確認落地位置

## A

### Agent

在本專案中，指可呼叫工具（例如檢索）再回答的邏輯層，不是單純聊天模型。

### ANN（Approximate Nearest Neighbor）

近似最近鄰搜尋。向量檢索常用 ANN 提升速度，用「可接受的近似」換效能。

## B

### Backfill

新增欄位/新功能後，把舊資料補齊。例：[`supabase/migrations/006_hybrid_search.sql`](../../supabase/migrations/006_hybrid_search.sql) 會把舊 `document_chunks` 回填 `fts`。

### BM25

常見關鍵詞排序演算法。PostgreSQL FTS 不是 BM25，但概念上都屬 lexical ranking。

## C

### Chunk

文件切片後的最小檢索單位。

### Chunk Overlap

相鄰 chunk 的重疊內容，減少語境被切斷。

### Citation

回答中的 `[1]`、`[2]`，對應來源片段。

### Citation Persistence

把來源存到 `messages.sources`，切換對話仍能還原引用（[`supabase/migrations/005_message_sources.sql`](../../supabase/migrations/005_message_sources.sql)）。

### Cosine Similarity

向量相似度分數，越高通常表示語意越接近。

## D

### Dynamic Top-K

不是固定 K，而是根據分數落差動態截斷。避免把低品質片段塞進提示詞。

### Document Ingestion

文件匯入流程：上傳 -> 解析 -> 切片 -> 向量化 -> 寫入資料庫。

## E

### Embedding

把文字轉成向量，讓系統可做語意搜尋。

### Evaluation Set

固定題組（query + expected evidence + answer points），用來比較不同版本檢索品質。

### Exact Match

關鍵詞精準匹配。對錯誤碼、函式名、型號特別重要。

## F

### Feature Flag

用設定開關控制功能。例：`rag_hybrid_enabled` 可快速切換 hybrid/vector。

### Fallback

主要路徑失效或關閉時的回退路徑。例：hybrid 關閉時回到 `match_documents`。

### Full-Text Search（FTS）

關鍵詞導向搜尋。CC-RAG 使用 PostgreSQL `tsvector + tsquery + ts_rank`。

## G

### GIN Index

PostgreSQL 的全文索引類型，用來加速 `tsvector` 查詢。

### Grounding

回答內容需被檢索證據支撐，降低「看起來對但其實沒根據」。

## H

### Heuristic Rerank

規則式二次排序。CC-RAG 目前用：similarity + keyword coverage + structure bonus。

### Hit@k

前 k 個檢索結果是否至少命中一段正確 evidence。

### Hybrid Search

結合 semantic search + full-text search，再融合排序。

## I

### IVF Flat（ivfflat）

pgvector 常見索引，透過分群加速近似向量搜尋。

### Index（索引）

加速查詢的資料結構。RAG 常見索引：ivfflat（向量）、GIN（全文）。

## J

### JSONB

PostgreSQL 的 JSON 二進位格式，適合存半結構化資料。CC-RAG 用於 `messages.sources`、`metadata`。

### JWT

身份 token，後端用來識別使用者。

## K

### Keyword Coverage

query 關鍵詞在 chunk 的覆蓋率，常用於 rerank 加分。

## L

### Latency

延遲。RAG 常拆成 embedding / retrieval / generation 三段觀察。

### Lexical Search

字詞匹配導向搜尋，與 semantic search 互補。

## M

### Match Count

資料庫函數一次最多回傳幾筆候選。例：`match_documents(match_count=...)`。

### Metadata

附加在 chunk 的結構化資訊，例如檔名、頁碼、段落標題。

### Migration

用 SQL 檔管理 schema 版本，確保環境一致。

## P

### pgvector

PostgreSQL extension，提供向量欄位與向量查詢能力。

### Prefetch

先多撈候選，再 rerank 與裁切。目的是提高召回率與可選空間。

### Precision

撈到的結果有多少是真的相關。Precision 高表示噪音少。

### Prompt Assembly

把系統指令、對話歷史、檢索片段組成最終提示詞的過程。

## Q

### Query Embedding

把使用者問題轉成向量，供 semantic search 使用。

### Query Rewriting

對 query 做改寫以提升檢索命中（本專案目前未啟用）。

## R

### RAG

Retrieval-Augmented Generation：先檢索再生成。

### Recall

應該撈到的相關證據，有多少被撈到。Recall 高表示漏抓少。

### Recall@k

只看前 k 筆時的召回率。

### Rerank

二次排序。先粗篩候選，再把高價值片段排到前面。

### RLS

Row-Level Security。資料庫行級權限保護。

### RRF（Reciprocal Rank Fusion）

融合多個排名來源的做法。CC-RAG 用於合併 vector rank + full-text rank。

公式：`score = w1/(k+r1) + w2/(k+r2)`。

## S

### Semantic Search

語意相近導向搜尋，重點是意思接近，不必字面完全一致。

### Similarity Threshold

相似度門檻。vector 模式常用 `rag_min_similarity` 過濾低分候選。

### SSE

Server-Sent Events，伺服器單向流式推送。

## T

### Top-K

最終送入 LLM 的片段數量。K 太小易漏、太大易噪音。

### tsvector

PostgreSQL 的全文索引向量欄位格式。CC-RAG 在 `document_chunks.fts` 使用。

### Trigger

資料庫觸發器。例：`trg_document_chunks_fts` 在內容更新時自動刷新 FTS 欄位。

### Tool Calling

模型先決定是否呼叫工具（如 `retrieve_documents`）再回答。

## V

### Vector Store

存放向量資料並支援相似搜尋的系統。CC-RAG 用 PostgreSQL + pgvector。

## 對照索引（建議延伸閱讀）

- Hybrid / RRF：[`.tutorial/rag/06-hybrid-search.md`](../rag/06-hybrid-search.md)
- 評測 / QA Pair：[`.tutorial/rag/07-evaluation-and-qa-pairs.md`](../rag/07-evaluation-and-qa-pairs.md)
- 快速全圖：[`.tutorial/rag/08-domain-knowledge-quick-map.md`](../rag/08-domain-knowledge-quick-map.md)
- 資料庫觀念：[`.tutorial/database/02-concepts.md`](../database/02-concepts.md)
