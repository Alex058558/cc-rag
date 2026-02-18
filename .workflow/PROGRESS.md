# PROGRESS

> Updated: 2026-02-19

## 狀態標記

- `[ ]` 未開始
- `[-]` 進行中
- `[x]` 已完成

---

## Phase 1: 專案基礎建設

- [x] 後端腳手架 (FastAPI + config + database)
- [x] Supabase project 建立與設定
- [x] Supabase tables: `conversations`, `messages` (SQL migration 已寫)
- [x] RLS policies 設定 (SQL migration 已寫)
- [ ] Storage bucket 建立 (需在 Supabase dashboard 操作)
- [x] 後端 Auth middleware (JWT 驗證)
- [x] 前端腳手架 (Vite + React + TypeScript + Tailwind + shadcn/ui)
- [x] 前端 Supabase client 設定
- [x] 前端 Auth context + Login page
- [x] 前端主版型 Layout component
- [x] `env.example` 範本建立
- [x] Phase 1 驗證：前後端啟動、TypeScript 零錯誤、FastAPI routes 載入正常

## Phase 2: 聊天介面 + LLM 串接

- [x] LLM client 封裝 (OpenAI SDK → Gemini)
- [x] Pydantic schemas 定義
- [x] 聊天 API endpoints (routes/chat.py) — SSE streaming
- [x] 聊天業務邏輯 (services/chat.py) — conversation CRUD + LLM stream
- [x] 前端 ChatPage + MessageList + MessageInput
- [x] 前端 ConversationSidebar
- [x] SSE 串流 hook (useChat.ts)
- [x] 對話管理 hook (useConversations.ts)
- [x] API helper (lib/api.ts)
- [x] Layout 改為 icon sidebar + chat 內嵌 conversation sidebar
- [-] Phase 2 驗證：建立對話、發送訊息、串流回應、歷史保存（代碼通過靜態檢查，待實際端到端測試）

## Phase 3: 文件匯入 + 處理管線

- [ ] 文件 API endpoints (routes/documents.py)
- [ ] 文件處理管線 (Docling + chunking + hashing)
- [ ] Embedding 服務 (Gemini text-embedding-004)
- [ ] 記錄管理 (去重、清理)
- [ ] Supabase tables: `documents`, `document_chunks`
- [ ] 前端 ImportPage + FileDropZone
- [ ] 前端 DocumentList + ProcessingStatus
- [ ] Phase 3 驗證：上傳文件、分塊、存入 pgvector、去重

## Phase 4: RAG 檢索 + 聊天整合

- [ ] 檢索服務 (vector + keyword + hybrid + reranking)
- [ ] Agent 工具定義 (retrieve_documents tool)
- [ ] Agent 核心 (tool calling loop)
- [ ] 聊天 API 整合 RAG
- [ ] Supabase vector search function + 全文搜索 index
- [ ] 前端引用來源顯示 (SourceCard)
- [ ] Phase 4 驗證：聊天引用文件、hybrid search、來源顯示

---

## 後續擴充（未開始）

- [ ] Metadata Extraction
- [ ] Sub-Agents
- [ ] Web Search
- [ ] Text-to-SQL
- [ ] LangSmith Observability
