# HANDOVER

> Updated: 2026-02-19 17:10
> Branch: main

## Current State

- Phase 4 已進入可用版本：聊天可檢索文件並回傳引用來源。
- 前端 citation 顯示已修正重複渲染問題，popover 可顯示完整 chunk 並補充引用關聯文字。
- frontend build 先前失敗的未使用變數已修正。

## Done (recent)

- `backend/services/retrieval.py`：已支援向量檢索 + `top_k=5` + `min_similarity=0.3` 篩選。
- `backend/agent/tools.py`：已定義 `retrieve_documents` tool。
- `backend/agent/agent.py`：已整合 tool calling 與來源回傳 (`sources` 事件)。
- `backend/routes/chat.py`：SSE 已串接 `sources` 與 `token` 事件。
- `frontend/src/components/chat/MessageList.tsx`：citation 解析改為逐一標記解析，避免 `[n]` 重複輸出。
- `frontend/src/components/chat/Citation.tsx`：popover 改為完整 chunk 可捲動顯示，並加入 `Referenced answer text`。
- `frontend/src/hooks/useChat.ts`、`frontend/src/pages/ChatPage.tsx`：移除未使用變數，恢復 build 可通過。

## In Progress

- 檢索策略仍為固定 `top_k`，尚未加入動態 Top-K 與 rerank。
- 尚未建立檢索品質觀測（例如命中率、引用對齊率、每題來源數）。

## Next Actions

1. 在 `backend/config.py` 增加 RAG 參數（`rag_top_k_*`、`rag_prefetch_k`、`rag_min_similarity`），改為可配置。
2. 在 `backend/services/retrieval.py` 增加兩段式流程：先 prefetch 候選，再依規則動態決定最終 `k`。
3. 新增簡易 rerank（關鍵詞覆蓋 + 結構命中）與檢索 log，完成後用 10-20 題做離線比較。

## Reference Docs

- `.workflow/PLAN.md`
- `.workflow/PROGRESS.md`
- `.tutorial/rag/04-retrieval-tuning.md`
