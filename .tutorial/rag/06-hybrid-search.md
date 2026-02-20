# Hybrid Search 實作：vector + full-text + RRF

## 這份文件在講什麼

這份是 CC-RAG Hybrid Search 的實作說明。重點不是「多一個搜尋」，而是讓檢索同時吃到：

- 向量語意匹配（semantic similarity）
- 精確關鍵詞匹配（full-text keyword match）

最後用 RRF（Reciprocal Rank Fusion）把兩邊排名合併，降低漏抓關鍵段落的機率。

## 為什麼要做 Hybrid

純向量搜尋在語意泛化很強，但遇到這類 query 容易漏：

- 錯誤碼（例如 `E11000`）
- 函式名、類別名
- 型號、版本號、英文專有詞

FTS（PostgreSQL full-text search）剛好補這個洞。

## 設計決策

### 1) FTS 配置用 `simple`

`to_tsvector('simple', content)` 不做語言詞幹化，規則單純、可預期。

中文分詞確實有限，但本專案讓 vector search 扛語意，FTS 主要補精確詞。

### 2) 排名融合用 RRF

公式：

```text
RRF score = semantic_weight / (rrf_k + semantic_rank)
          + full_text_weight / (rrf_k + full_text_rank)
```

好處是不用硬做 score normalization（cosine 與 `ts_rank` 量綱不同）。

### 3) 在 SQL function 內融合

透過單一 RPC `hybrid_search(...)` 完成 semantic + full-text + fusion。

好處：

- 少一次網路 round trip
- 排序邏輯集中在 DB 層，行為一致

### 4) `fts` 用 trigger 維護

選 trigger 而不是 generated column，避免 `to_tsvector()` 在此情境的限制，更新語意也比較直覺。

## 對應實作

### Migration

- `supabase/migrations/006_hybrid_search.sql`
  - `document_chunks.fts tsvector`
  - GIN index
  - `trg_document_chunks_fts` trigger
  - backfill
  - `hybrid_search(...)` function

### Backend

- `backend/config.py`
  - `rag_hybrid_enabled`
  - `rag_rrf_k`
  - `rag_full_text_weight`
  - `rag_semantic_weight`

- `backend/services/retrieval.py`
  - `_prefetch()` 依條件切 hybrid/vector
  - hybrid 模式不走 `min_similarity` 門檻
  - log 顯示 `[retrieval][hybrid]` 或 `[retrieval][vector]`

## 執行流程（Hybrid 開啟時）

```text
query_text + query_embedding
  -> hybrid_search RPC
    -> semantic CTE (vector rank)
    -> full_text CTE (ts_rank rank)
    -> FULL OUTER JOIN by chunk id
    -> RRF score 融合
  -> heuristic rerank
  -> dynamic top-k
  -> 回傳 chunks
```

## 參數建議

| 參數 | 預設值 | 作用 |
|------|--------|------|
| `rag_hybrid_enabled` | `true` | 是否啟用 hybrid |
| `rag_rrf_k` | `60` | RRF 平滑常數 |
| `rag_full_text_weight` | `1.0` | FTS 分支權重 |
| `rag_semantic_weight` | `1.0` | Vector 分支權重 |

調參建議：

- 若 query 多為錯誤碼/術語：提高 `rag_full_text_weight`
- 若 query 多為自然語句：提高 `rag_semantic_weight`
- 若前幾名波動太大：提高 `rag_rrf_k`

## 驗證清單

1. 套用 migration 後，`document_chunks.fts` 已有值（含舊資料）
2. 開啟 `RAG_HYBRID_ENABLED=true`，log 出現 `[retrieval][hybrid]`
3. 關閉 `RAG_HYBRID_ENABLED=false`，log 回到 `[retrieval][vector]`
4. 用含精確關鍵詞的問題比對：hybrid 能撈到純 vector 容易漏掉的 chunk

## 常見問題

### Q: 為什麼 hybrid 模式不套 `rag_min_similarity`？

Hybrid 模式 `similarity` 欄位存的是 RRF 分數，不是 cosine similarity。沿用原本門檻會錯砍結果。

### Q: 為什麼不直接在 Python 端合併？

可以做，但會多一次查詢與傳輸；目前規模下 SQL 內融合更簡潔。
