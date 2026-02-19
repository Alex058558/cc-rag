# HANDOVER

> Updated: 2026-02-19
> Branch: main

## Current State

Phase 3 完成並驗證通過。文件上傳 → Docling 解析 → chunking → embedding → pgvector 全管線正常運作。

## Done (recent)

**Phase 3 後端**
- `backend/services/embedding.py` — Gemini text-embedding-004 via OpenAI SDK，batch 20
- `backend/services/document_processor.py` — SHA-256 hash、Docling 解析（ThreadPoolExecutor）、paragraph chunking（1500 chars / 150 overlap）
- `backend/services/record_manager.py` — content_hash 去重、chunk 批次寫入
- `backend/routes/documents.py` — POST/GET/DELETE，BackgroundTask 處理管線
- `backend/main.py` — 加入 logging 設定
- `backend/requirements.txt` — 加入 docling

**Phase 3 前端**
- `frontend/src/hooks/useDocuments.ts` — fetch/upload/delete + 有 active 文件時每 3s polling
- `frontend/src/components/import/FileDropZone.tsx` — 拖拽 + click upload
- `frontend/src/components/import/DocumentList.tsx` — 文件清單 + status badge
- `frontend/src/components/import/ProcessingStatus.tsx` — processing banner
- `frontend/src/pages/ImportPage.tsx` — 整合以上元件

**Supabase**
- `supabase/migrations/004_storage_bucket.sql` — documents bucket + Storage RLS

**已知 Gotchas（已修）**
- Supabase Storage 不接受非 ASCII key → storage path 用 `{user_id}/{hash}{ext}`
- Gemini embedding API 回傳 `index=None` → 移除 sort by index

## Next Actions

開始 Phase 4：RAG 檢索 + 聊天整合

1. 建立 `backend/services/retrieval.py` — vector search via `match_documents()` RPC
2. 建立 `backend/agent/tools.py` — `retrieve_documents` tool 定義
3. 建立 `backend/agent/agent.py` — tool calling loop
4. 更新 `backend/routes/chat.py` — 整合 RAG
5. 前端：`SourceCard.tsx` + 更新 `MessageList.tsx` 顯示引用來源

## Reference Docs

- `.workflow/PLAN.md` — 完整技術架構與 4 Phase 實作計畫
- `.workflow/PROGRESS.md` — 各 Phase 細項進度追蹤
