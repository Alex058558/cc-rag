# RAG 領域知識速讀地圖

## 這份給誰

給需要快速回顧 RAG 的開發者。目標是 10 分鐘內抓回核心脈絡。

## 一張圖理解 RAG

```text
使用者問題
  -> Query embedding
  -> Retrieval (vector / hybrid)
  -> Rerank
  -> Top-k context
  -> LLM 生成回答
  -> Citation 回傳來源
```

## 必備 10 個名詞

1. `Chunking`：把文件切成可檢索單位
2. `Embedding`：把文字映射到向量空間
3. `Vector search`：用語意相近度找內容
4. `Full-text search`：用關鍵詞精準匹配
5. `Hybrid search`：語意 + 關鍵詞融合
6. `RRF`：融合不同檢索排名的方式
7. `Rerank`：第二階段重排，提高前幾名品質
8. `Top-k`：送進 LLM 的片段數量
9. `Citation`：回答對應到來源片段
10. `Eval set`：固定題組，用來比較版本品質

## 方法論：四個核心原則

- 沒有 retrieval quality，就沒有 generation quality
- 先做可重跑評測，再做調參，不要反過來
- 分開看 retrieval 與 generation，問題比較好定位
- 任何參數調整都要有前後對照結果

## 專案對照（CC-RAG）

- Retrieval：[`backend/services/retrieval.py`](../../backend/services/retrieval.py)
- Hybrid SQL：[`supabase/migrations/006_hybrid_search.sql`](../../supabase/migrations/006_hybrid_search.sql)
- 參數：[`backend/config.py`](../../backend/config.py)
- 評測集：[`eval/EVAL_PIANO_V1.yaml`](../../eval/EVAL_PIANO_V1.yaml)

## 常見誤區

- 只看回答順不順，不看 evidence 是否命中
- 調參只靠體感，沒有固定題組
- 把所有問題都交給 semantic，忽略 exact keyword 場景
- 沒有 fallback 路徑，出問題時無法快速回退

## 複習順序（15 分鐘版）

1. 先看 [`.tutorial/rag/01-concept.md`](01-concept.md)
2. 再看 [`.tutorial/rag/06-hybrid-search.md`](06-hybrid-search.md)
3. 再看 [`.tutorial/rag/07-evaluation-and-qa-pairs.md`](07-evaluation-and-qa-pairs.md)
4. 最後用這份地圖做總結
