# 檢索調參：三段式檢索與 Hybrid 模式

## 這份文件在講什麼

說明專案目前的檢索流程：Hybrid/Vector prefetch、heuristic rerank、dynamic top-k，以及各階段設定參數。

## 檢索流程總覽

```
使用者提問
  ↓
Embedding (Gemini text-embedding-004)
  ↓
Stage 1: Prefetch
  Hybrid 開啟且有 query_text：走 hybrid_search（RRF 分數）
  否則走 match_documents（pgvector cosine similarity）
  Vector 模式才套 min_similarity
  ↓
Stage 2: Heuristic Rerank
  用 query 原文做關鍵詞覆蓋 + 結構特徵重排
  ↓
Stage 3: Dynamic Top-K
  從第 1 名往下看，similarity 掉太多就截斷
  最終回傳 top_k_min ~ top_k_max 筆
  ↓
送進 LLM（附帶 [1][2] 引用標記）
```

## 設定參數

所有參數在 `backend/config.py` 的 `Settings` class，可透過 `.env` 覆蓋：

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `rag_prefetch_k` | 15 | Stage 1 撈多少候選 |
| `rag_min_similarity` | 0.3 | 最低 cosine similarity 門檻 |
| `rag_top_k_max` | 5 | 最終最多回幾筆 |
| `rag_top_k_min` | 1 | 最終最少回幾筆 |
| `rag_similarity_drop_ratio` | 0.6 | Dynamic top-k 截斷比例（低於最高分 * 此值就砍） |
| `rag_hybrid_enabled` | true | 是否啟用 hybrid search |
| `rag_rrf_k` | 60 | RRF 平滑常數 |
| `rag_full_text_weight` | 1.0 | Full-text 分支權重 |
| `rag_semantic_weight` | 1.0 | Vector 分支權重 |

## Stage 2: Heuristic Rerank 細節

綜合分數公式：

```
final_score = similarity * 0.7 + keyword_coverage * 0.25 + structure_bonus
```

- `similarity` — vector 模式是 cosine；hybrid 模式是 RRF score
- `keyword_coverage` — query 關鍵詞在 chunk 中的出現比例（0~1）
- `structure_bonus` — chunk 開頭是 markdown heading 的話 +0.05

關鍵詞抽取用簡易斷詞：去掉停用詞，保留 2 字以上的 token。中文因為沒有空白分詞，效果有限，主要靠 similarity 主導排序。

## Stage 3: Dynamic Top-K 細節

邏輯：

1. 一定取前 `top_k_min` 筆
2. 從第 `top_k_min + 1` 筆開始，如果 `sim >= top_sim * drop_ratio` 就繼續收
3. 一旦低於門檻或到達 `top_k_max` 就停止

效果：問題明確時只回 1~2 筆精準結果，問題模糊或跨章節時回到 5 筆。

## Citation 持久化

助手訊息的引用來源會存入 `messages.sources` JSONB 欄位（migration: `005_message_sources.sql`），切換對話再回來時 citation 仍可正常顯示。

## 對應程式碼

- `backend/config.py` — RAG 參數定義
- `backend/services/retrieval.py` — 三段式檢索
- `backend/agent/agent.py` — agent tool calling + citation prompt
- `backend/routes/chat.py` — sources 持久化
- `supabase/migrations/005_message_sources.sql` — messages 表加 sources 欄位

## 驗證方式

用固定題組比較升級前後：

- 引用是否更貼合回答語句
- 是否減少漏答與答非所問
- 每題引用數是否更穩定
- 回答延遲是否可接受

## 未來可升級方向

- 換成專業 rerank 模型（Cohere Rerank、Jina Rerank）— 只需替換 `heuristic_rerank` 函式
- 加入中文斷詞（jieba）提升 keyword coverage 對中文的效果
- Hybrid 權重自動調參（依 query 類型動態調整 lexical/semantic 比重）

## 相關延伸

- [06-hybrid-search.md](06-hybrid-search.md) -- Hybrid Search SQL 與參數設計
