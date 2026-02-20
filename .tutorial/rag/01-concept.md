# RAG 核心概念

## 什麼是 RAG？

RAG 是 `Retrieval-Augmented Generation`，中文常翻成「檢索增強生成」。

一句話版本：

- 先從你的文件中「找資料」
- 再讓 LLM 根據這些資料回答

這樣可以大幅降低「憑印象胡亂回答」的機率。

## 為什麼需要 RAG？

純 LLM 回答有兩個限制：

1. 不知道你的私有資料（公司文件、課程講義、內部規範）
2. 知識有時間限制，且可能產生幻覺

RAG 把「可查證的內容」放進提示詞，讓回答更可追溯。

## CC-RAG 裡的最小流程

```text
使用者問題
-> 將問題轉 embedding
-> 在 document_chunks 做向量檢索
-> 取前幾個相關 chunk
-> 把 chunk 與問題一起丟給 LLM
-> LLM 回答並標記引用 [1][2]...
```

## 核心名詞

### 1) Embedding

把文字轉成向量（數字陣列）。語意越接近，向量距離通常越近。

### 2) Chunk

長文件切成的小段落。檢索不是整份文件找，而是找 chunk。

### 3) Similarity

「問題向量」與「chunk 向量」的相似程度。

### 4) Top-K

檢索取前 K 筆。K 太小可能漏資料，K 太大可能引入雜訊。

### 5) Prefetch

在最終取 Top-K 之前，先多撈一批候選（例如 15 筆），給後續的 rerank 和動態裁切更多素材可選。

就像考試閱卷：不是只看前 5 份，而是先粗看 15 份，再從裡面精選最好的。

### 6) Rerank

二次排序。向量檢索的結果不一定完美，rerank 用額外規則（或模型）重新打分排序。

本專案用 **heuristic rerank**：以 vector similarity 為主（70%），加上關鍵詞覆蓋率（25%）和結構特徵加分（5%），不需要外部模型。

### 7) Dynamic Top-K

不固定取幾筆，而是根據候選分數分佈動態決定。如果前幾筆分數很集中、後面突然掉很多，就自動截斷，避免引入低品質來源。

### 8) Citation

回答中的 `[1]`、`[2]`。數字對應到檢索來源清單索引。

引用來源會存入資料庫（`messages.sources` JSONB），切換對話再回來時仍可正常顯示。

## 你專案目前設定（2026-02）

- 檢索流程：三段式（Prefetch → Heuristic Rerank → Dynamic Top-K）
- Prefetch：`rag_prefetch_k=15`
- 最終回傳：`rag_top_k_min=1` ~ `rag_top_k_max=5`
- 門檻：`rag_min_similarity=0.3`
- 動態截斷：`rag_similarity_drop_ratio=0.6`（低於最高分 * 0.6 就砍）
- Embedding 維度：`vector(768)`
- Embedding 模型：`text-embedding-004`

所有 RAG 參數可透過 `.env` 覆蓋，定義在 `backend/config.py`。

對應檔案：

- `backend/config.py` — RAG 參數
- `backend/services/retrieval.py` — 三段式檢索
- `backend/services/embedding.py` — 向量化
- `supabase/migrations/002_vector_search.sql` — pgvector search function
- `supabase/migrations/005_message_sources.sql` — citation 持久化

## 一個實例

問題：

```text
鋼琴訓練是否會影響白質？
```

RAG 做的事：

1. 找到含有「白質、胼胝體、FA」等內容的 chunk
2. 把這些 chunk 當證據提供給 LLM
3. LLM 生成回答，並在句子後加 `[1]` `[2]`

前端再把 `[1]` 轉成可點擊引用，顯示對應 chunk。

## 常見誤解

### 誤解 1：RAG 會讓答案永遠正確

不是。RAG 只能提高「有根據」的機率，還是要看檢索品質與提示詞設計。

### 誤解 2：Chunk 越多越好

不一定。太多來源會稀釋重點，反而讓回答變散。

### 誤解 3：有引用就代表一定對

引用只是「有來源」，不代表來源內容一定真的支持那句話。仍需檢查對齊品質。
