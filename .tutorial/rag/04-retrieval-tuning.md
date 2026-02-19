# 檢索調參：動態 Top-K 與 Rerank 計畫

## 這份文件在講什麼

記錄目前專案的檢索行為、限制來源，以及下一步要怎麼升級成可配置動態 Top-K。

## 目前狀態（2026-02-19）

- 目前 `retrieve_chunks()` 使用固定 `top_k=5`。
- 目前有 `min_similarity=0.3` 篩選。
- 目前沒有 rerank，向量檢索後直接回傳來源。

對應程式碼：

- `backend/services/retrieval.py`
- `backend/agent/agent.py`

## 為什麼要做動態 Top-K

固定 `top_k` 對不同問題不一定合適：

- 問題單純時，k 太大會帶入噪音。
- 問題需要跨章節整合時，k 太小會漏掉關鍵段落。

動態 Top-K 的目標是讓每題用最適合的來源數量，而不是一律固定值。

## 什麼是「可配置動態 Top-K」

### 可配置（Configurable）

把參數放進設定，不把數字寫死在程式：

- `RAG_TOP_K_DEFAULT`
- `RAG_TOP_K_MIN`
- `RAG_TOP_K_MAX`
- `RAG_PREFETCH_K`
- `RAG_MIN_SIMILARITY`

### 動態（Dynamic）

每次 query 根據候選分數與問題型態決定最終 `k`：

- 分數頭部集中 -> 較小 k（更精準）
- 分數分散、跨主題 -> 較大 k（提高召回）

## Rerank 是什麼

Rerank 是二次排序。

流程是：

1. 先用向量檢索抓一批候選（例如 12 筆）
2. 用額外規則或模型重排候選
3. 取前 k 筆送給 LLM

它的價值是降低噪音，讓真正相關的 chunk 更靠前。

## 目標實作（下一步）

1. 在 `backend/config.py` 新增 RAG 參數。
2. 在 `backend/services/retrieval.py` 改為 prefetch + finalize 流程。
3. 實作 `choose_top_k(query, candidates)`，根據分數分布與 query 特徵回傳最終 `k`。
4. 加入第一版 rerank（關鍵詞覆蓋、章節標題命中）。
5. 增加檢索 log，記錄每題候選數、最終 k、平均相似度。

## 驗證方式

用固定題組比較升級前後：

- 引用是否更貼合回答語句
- 是否減少漏答與答非所問
- 每題引用數是否更穩定
- 回答延遲是否可接受

## 與目前引用顯示修正的關係

前端已修正 citation 重複與截斷問題。接下來做動態 Top-K / rerank 後，會再提高「引用內容與回答文字」的一致性。
