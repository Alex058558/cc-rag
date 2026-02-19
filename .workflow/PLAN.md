# Kanaria CC-RAG: Agentic RAG 實作計畫

## 目標

建構可實際使用的 RAG 應用，包含聊天介面與文件匯入功能。透過漸進式開發，學習 RAG 技術原理（chunking、embedding、hybrid search、reranking）並建立實用工具。

## 技術架構

```
Frontend (React + Vite + Tailwind + shadcn/ui)
    ↓ REST + SSE
Backend (Python + FastAPI)
    ├── Agent Layer (tool calling)
    ├── RAG Pipeline (retrieval + reranking)
    └── Document Processor (Docling)
    ↓
Supabase (Postgres + pgvector + Auth + Storage)
    ↓
LLM (Gemini via OpenAI-compatible API)
```

## 技術選型

| 層級      | 技術                                             | 說明                             |
|-----------|--------------------------------------------------|----------------------------------|
| Frontend  | React + TypeScript + Vite + Tailwind + shadcn/ui | 現代化 UI                        |
| Backend   | Python + FastAPI                                 | 輕量高效                         |
| Database  | Supabase (Postgres + pgvector)                   | 全託管，練習 Postgres             |
| Auth      | Supabase Auth                                    | 內建 RLS                         |
| Storage   | Supabase Storage                                 | 文件存放                         |
| LLM       | OpenAI SDK → Gemini (Google AI Studio)           | OpenAI-compatible，省錢           |
| Embedding | Gemini text-embedding-004                        | 768 維                           |
| Streaming | SSE (Server-Sent Events)                         | 即時回應串流                     |
| 文件處理  | Docling                                          | 多格式支援 (PDF, DOCX, HTML, MD) |

## 關鍵技術決策

- 不用 LangChain/LlamaIndex — 直接使用 OpenAI SDK + Pydantic，學習底層原理
- Row-Level Security — 所有表都啟用 RLS，用戶只能看到自己的資料
- SSE Streaming — 聊天回應即時串流
- Stateless Completions — 應用端管理 chat history
- Pydantic 結構化輸出 — LLM 回應用 Pydantic model 約束

---

## Phase 1: 專案基礎建設

**目標**：建立前後端腳手架、Supabase 連接、基本認證流程。

### 後端 (`backend/`)

- `backend/main.py` — FastAPI 入口，CORS 設定
- `backend/config.py` — 環境變數管理 (Pydantic Settings)
- `backend/database.py` — Supabase client 初始化
- `backend/auth/middleware.py` — JWT 驗證 middleware
- `backend/requirements.txt` — 依賴管理
- `backend/.env.example` — 環境變數範本

### 前端 (`frontend/`)

- Vite + React + TypeScript 初始化
- Tailwind CSS + shadcn/ui 設定
- `frontend/src/lib/supabase.ts` — Supabase client
- `frontend/src/contexts/AuthContext.tsx` — 認證 context
- `frontend/src/pages/LoginPage.tsx` — 登入/註冊頁
- `frontend/src/components/Layout.tsx` — 主版型

### Supabase

- 建立 project，啟用 pgvector extension
- 建立 tables: `conversations`, `messages`
- 設定 RLS policies
- 設定 Storage bucket (`documents`)

### 驗證

- 前後端啟動正常
- 登入/登出流程完整
- API 請求附帶有效 JWT 驗證通過

---

## Phase 2: 聊天介面 + LLM 串接

**目標**：完成基本聊天功能，可與 Gemini 對話，支援 SSE 串流。

### 後端

- `backend/llm/client.py` — OpenAI SDK 封裝，指向 Gemini endpoint
- `backend/llm/schemas.py` — Pydantic models
- `backend/routes/chat.py` — 聊天 API (POST /api/chat, GET /api/conversations, etc.)
- `backend/services/chat.py` — 聊天業務邏輯，管理 conversation memory

### 前端

- `frontend/src/pages/ChatPage.tsx` — 主聊天頁面
- `frontend/src/components/chat/MessageList.tsx` — 訊息列表（markdown 渲染）
- `frontend/src/components/chat/MessageInput.tsx` — 輸入框
- `frontend/src/components/chat/ConversationSidebar.tsx` — 對話列表側欄
- `frontend/src/hooks/useChat.ts` — SSE 串流 hook
- `frontend/src/hooks/useConversations.ts` — 對話管理 hook

### Supabase

- `messages` table: id, conversation_id, role, content, created_at, user_id
- `conversations` table: id, title, created_at, updated_at, user_id
- RLS: 用戶只能存取自己的對話與訊息

### 驗證

- 能建立對話、發送訊息
- Gemini SSE 串流回應正常
- 對話歷史正確保存

---

## Phase 3: 文件匯入 + 處理管線

**目標**：拖拽上傳文件，自動處理（解析、分塊、嵌入），存入向量資料庫。

### 後端

- `backend/routes/documents.py` — 文件 API (upload, list, delete)
- `backend/services/document_processor.py` — 文件處理管線 (Docling + chunking + hashing)
- `backend/services/embedding.py` — Embedding 服務 (Gemini text-embedding-004)
- `backend/services/record_manager.py` — 記錄管理（去重、清理）

### 前端

- `frontend/src/pages/ImportPage.tsx` — 文件匯入頁面
- `frontend/src/components/import/FileDropZone.tsx` — 拖拽上傳區
- `frontend/src/components/import/DocumentList.tsx` — 已匯入文件列表
- `frontend/src/components/import/ProcessingStatus.tsx` — 處理進度

### Supabase

- `documents` table: id, filename, file_type, file_size, storage_path, status, content_hash, chunk_count, user_id, created_at
- `document_chunks` table: id, document_id, content, chunk_index, token_count, embedding (vector(768)), metadata (jsonb), user_id, created_at
- Storage bucket: `documents`

### 驗證

- 上傳 PDF/DOCX 成功
- 文件被正確分塊並存入 pgvector
- 去重生效

---

## Phase 4: RAG 檢索 + 聊天整合

**目標**：聊天時自動檢索相關文件片段，實作 hybrid search + reranking。

### 後端

- `backend/services/retrieval.py` — 檢索服務 (vector + keyword + hybrid + reranking)
- `backend/agent/tools.py` — Agent 工具定義 (retrieve_documents tool)
- `backend/agent/agent.py` — Agent 核心 (tool calling loop + context assembly)
- 更新 `backend/routes/chat.py` — 整合 RAG 到聊天流程

### 前端

- 更新 `MessageList.tsx` — 顯示引用來源
- `frontend/src/components/chat/SourceCard.tsx` — 引用來源卡片

### Supabase

- 建立向量搜尋 function: `match_documents`
- 建立全文搜索 index

### 驗證

- 聊天時能自動引用已上傳的文件內容
- Hybrid search 結果正確
- 引用來源顯示在前端

---

## 後續擴充功能（暫不實作）

| 優先級 | 功能                    | 價值                                     | 複雜度 |
|--------|-------------------------|------------------------------------------|--------|
| 1      | Metadata Extraction     | LLM 自動提取文件 metadata，提升檢索精度   | 中     |
| 2      | Sub-Agents              | 隔離 context 的子 agent，委派特定分析任務 | 中高   |
| 3      | Web Search              | 知識庫外的 fallback，提升回答覆蓋率       | 低     |
| 4      | Text-to-SQL             | 對結構化資料的自然語言查詢               | 中     |
| 5      | LangSmith Observability | 追蹤 LLM 呼叫、檢索品質、成本              | 低     |

---

## 專案結構

```
cc-rag/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── auth/
│   │   └── middleware.py
│   ├── llm/
│   │   ├── client.py
│   │   └── schemas.py
│   ├── routes/
│   │   ├── chat.py
│   │   └── documents.py
│   ├── services/
│   │   ├── chat.py
│   │   ├── document_processor.py
│   │   ├── embedding.py
│   │   ├── record_manager.py
│   │   └── retrieval.py
│   └── agent/
│       ├── agent.py
│       └── tools.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   ├── supabase.ts
│       │   └── utils.ts
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   ├── useChat.ts
│       │   ├── useConversations.ts
│       │   └── useDocuments.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── ChatPage.tsx
│       │   └── ImportPage.tsx
│       └── components/
│           ├── Layout.tsx
│           ├── ui/
│           │   ├── button.tsx
│           │   ├── card.tsx
│           │   ├── input.tsx
│           │   └── popover.tsx
│           ├── chat/
│           │   ├── MessageList.tsx
│           │   ├── MessageInput.tsx
│           │   ├── ConversationSidebar.tsx
│           │   ├── Citation.tsx
│           │   └── SourceCard.tsx
│           └── import/
│               ├── FileDropZone.tsx
│               ├── DocumentList.tsx
│               └── ProcessingStatus.tsx
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_vector_search.sql
│       ├── 003_rls_policies.sql
│       └── 004_storage_bucket.sql
├── .workflow/
│   ├── PLAN.md
│   ├── PROGRESS.md
│   └── HANDOVER.md
└── .tutorial/
    ├── README.md
    ├── basic/
    ├── backend/
    ├── frontend/
    ├── database/
    └── rag/
```
