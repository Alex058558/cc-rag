# CC-RAG 專案介紹

## 這是什麼？

CC-RAG 是一個 **RAG（檢索增強生成）應用程式**。

簡單來說：把文件、PDF、Word 丟進去，然後問 AI 相關問題。

## 專案架構

```
┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend       │
│   (React)       │ ←──→ │   (FastAPI)     │
│                 │      │                 │
│  使用者介面      │      │  商業邏輯        │
└─────────────────┘      └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │   Supabase      │
                         │  (資料庫)        │
                         └─────────────────┘
```

## Phase 1 完成什麼？

### 後端
- `main.py` - FastAPI 入口 + CORS + health endpoint
- `config.py` - Pydantic Settings 管理環境變數
- `database.py` - Supabase client (anon + admin)
- `auth/middleware.py` - JWT 驗證
- `routes/chat.py`, `routes/documents.py` - API 路由骨架

### 前端
- Vite + React + TypeScript + Tailwind v4 + shadcn/ui
- AuthContext - 完整的登入/註冊/登出
- LoginPage - 登入/註冊表單
- Layout - Sidebar 導航 + 登出
- App.tsx - Router + ProtectedRoute 守衛

### 資料庫
- `001_initial_schema.sql` - conversations + messages 表
- `002_vector_search.sql` - documents + document_chunks + 向量搜尋
- `003_rls_policies.sql` - 全部 4 張表的 RLS policies

## 學習路徑（建議閱讀順序）

建議按這個順序看：

1. `.tutorial/basic/03-phase-1-foundation.md`
2. `.tutorial/basic/04-phase-2-chat-llm.md`
3. `.tutorial/basic/05-phase-3-document-pipeline.md`
4. `.tutorial/basic/06-phase-4-rag-chat-integration.md`
5. `.tutorial/basic/07-rag-glossary.md`

搭配專題章節：

- `.tutorial/rag/01-concept.md`
- `.tutorial/rag/02-sse-streaming.md`
- `.tutorial/rag/03-document-pipeline.md`
- `.tutorial/rag/04-retrieval-tuning.md`
