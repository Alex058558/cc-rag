# 檢索調參：動態 Top-K 與 Rerank

## 這份文件在講什麼

解釋目前專案的檢索行為、為什麼固定 Top-K 不夠用，以及動態 Top-K 和 Rerank 的概念。

## 目前狀態

- `retrieve_chunks()` 使用固定 `top_k=5`
- `min_similarity=0.3` 篩選
- 沒有 rerank，向量檢索後直接回傳來源

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

## 驗證方式

用固定題組比較升級前後：

- 引用是否更貼合回答語句
- 是否減少漏答與答非所問
- 每題引用數是否更穩定
- 回答延遲是否可接受

## 與目前引用顯示修正的關係

前端已修正 citation 重複與截斷問題。接下來做動態 Top-K / rerank 後，會再提高「引用內容與回答文字」的一致性。
