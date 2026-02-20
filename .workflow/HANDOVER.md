# HANDOVER

> Updated: 2026-02-20
> Branch: main

## Current State

- Phase 4 檢索品質提升已完成：三段式檢索（prefetch → heuristic rerank → dynamic top-k）。
- RAG 參數全部可配置（config.py + .env）。
- Citation 持久化已實作：sources 存入 messages JSONB 欄位，切換對話不會丟失引用。
- System prompt 已強化引用格式規則，避免 LLM 搬用原文獻編號。
- 所有教學文件已同步更新：概念說明、名詞表、Phase 主線、專題文件。

## Done (recent)

- `backend/config.py`：新增 `rag_prefetch_k`, `rag_top_k_max`, `rag_top_k_min`, `rag_min_similarity`, `rag_similarity_drop_ratio`。
- `backend/services/retrieval.py`：重寫為三段式（prefetch → heuristic_rerank → dynamic_topk），各階段 structured log。
- `backend/agent/agent.py`：傳入 query_text 給 rerank；強化 system prompt 引用格式規則。
- `backend/routes/chat.py`：收集 sources 並傳給 save_message 持久化。
- `backend/services/chat.py`：save_message 支援 optional sources 參數。
- `backend/llm/schemas.py`：MessageOut 加 sources 欄位。
- `supabase/migrations/005_message_sources.sql`：messages 表加 sources JSONB。
- 教學文件同步：`rag/01-concept.md`、`rag/03-document-pipeline.md`、`rag/04-retrieval-tuning.md`、`basic/06-phase-4-rag-chat-integration.md`、`basic/07-rag-glossary.md`、`.tutorial/README.md`。

## In Progress

- 離線題組驗證（10-20 題比較升級前後品質）尚未執行。

## Next Actions

1. 用固定題組做離線比較，確認 rerank + dynamic top-k 的品質提升。
2. 評估是否需要中文斷詞（jieba）提升 heuristic rerank 對中文的效果。
3. 實作 hybrid search：建立 full-text search index + 合併 vector + keyword 結果。
4. 考慮後續擴充：Metadata Extraction、Sub-Agents、Web Search。

## Reference Docs

- `.workflow/PLAN.md`
- `.workflow/PROGRESS.md`
- `.tutorial/rag/04-retrieval-tuning.md`
- `.tutorial/basic/07-rag-glossary.md`
