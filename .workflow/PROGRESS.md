# PROGRESS

> Updated: 2026-02-20

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
- [x] Storage bucket 建立（已由 `004_storage_bucket.sql` migration 建立並套用 RLS）
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
- [x] Phase 2 驗證：建立對話、發送訊息、串流回應、歷史保存

## Phase 3: 文件匯入 + 處理管線

- [x] 文件 API endpoints (routes/documents.py)
- [x] 文件處理管線 (Docling + chunking + hashing)
- [x] Embedding 服務 (Gemini text-embedding-004)
- [x] 記錄管理 (去重、清理)
- [x] Supabase tables: `documents`, `document_chunks` (SQL migration 已寫)
- [x] Supabase Storage bucket migration (004_storage_bucket.sql)
- [x] 前端 ImportPage + FileDropZone
- [x] 前端 DocumentList + ProcessingStatus
- [x] 前端 useDocuments hook (含 polling)
- [x] Phase 3 驗證：上傳文件、分塊、存入 pgvector、去重（已完成端到端流程）

## Phase 4: RAG 檢索 + 聊天整合

- [x] 檢索服務 (三段式：prefetch + heuristic rerank + dynamic top-k)
- [x] RAG 參數可配置 (config.py: rag_prefetch_k, rag_top_k_*, rag_min_similarity, rag_similarity_drop_ratio)
- [x] Agent 工具定義 (retrieve_documents tool)
- [x] Agent 核心 (tool calling loop)
- [x] 聊天 API 整合 RAG
- [x] Citation 持久化 (messages.sources JSONB, migration 005)
- [x] Supabase vector search function (pgvector cosine similarity)
- [ ] 全文搜索 index (tsvector + hybrid search)
- [x] 前端引用來源顯示 (SourceCard / Citation popover)
- [-] Phase 4 驗證：聊天引用文件、來源顯示（hybrid search 待補）

---

## 後續擴充（未開始）

### 優先級 High -- 檢索品質直接提升

- [ ] Hybrid Search -- 建立 tsvector index，合併 vector + keyword 結果，提升召回率
- [ ] 中文斷詞（jieba）-- 改善 heuristic rerank 的 keyword coverage 對中文的效果
- [ ] 離線評測題組 -- 固定 10-20 題比較檢索品質，量化調參效果

### 優先級 Medium -- 功能擴展

- [ ] Metadata Extraction -- 自動抽取文件標題、作者、日期等 metadata
- [ ] Sub-Agents -- 拆分 retrieval / summarization / comparison 等子任務
- [ ] Web Search Tool -- 讓 agent 可以搜尋網路資料，補充本地文件不足

### 優先級 Low -- 進階能力

- [ ] Text-to-SQL -- 讓 agent 查詢結構化資料
- [ ] Rerank 模型替換 -- 換 Cohere / Jina rerank 模型取代 heuristic
- [ ] LangSmith / Phoenix Observability -- 追蹤 retrieval + LLM 呼叫鏈
- [ ] Multi-modal -- 支援圖片 chunk（Docling 已有基礎能力）
