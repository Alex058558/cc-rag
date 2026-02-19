[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG 是一個用來練習 RAG 的全端專案：上傳文件、做向量檢索、在聊天中引用來源。

## 目前做到哪裡

- 聊天 + SSE 串流回覆
- 文件上傳與背景處理（Docling -> chunk -> embedding）
- Supabase pgvector 檢索
- 回答引用來源（`[1]`, `[2]`）與前端 popover 預覽

## 技術堆疊

| 層面 | 技術 |
|------|------|
| 前端 | React + TypeScript + Vite + Tailwind + shadcn/ui |
| 後端 | FastAPI + Python + Uvicorn |
| 資料庫 | Supabase (PostgreSQL + Auth + pgvector + Storage) |
| LLM | Gemini（OpenAI-compatible API） |
| 文件解析 | Docling |

## 快速開始

### 1) 準備環境變數

這個 repo 目前沒有 `backend/.env.example`，請手動建立 `backend/.env`：

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

前端 `frontend/.env`：

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

### 2) 套用 Supabase migrations

在 Supabase SQL Editor 依序執行：

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_vector_search.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_storage_bucket.sql`

### 3) 啟動後端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4) 啟動前端

```bash
cd frontend
npm install
npm run dev
```

前端預設在 `http://localhost:5173`，後端在 `http://localhost:8000`。

## 開發提示

- Vite 7 建議 Node >= `20.19`（目前低於這個版本仍可能可跑，但建議升級）
- 如果你使用 `mise`：

```bash
mise install node@20.19
mise use node@20.19
```

## 專案結構（精簡版）

```text
cc-rag/
├── backend/
│   ├── agent/        # tool calling 與 RAG 回應流程
│   ├── routes/       # chat/documents API
│   ├── services/     # chat/retrieval/embedding/document pipeline
│   └── llm/          # Gemini client + schemas
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── contexts/
├── supabase/migrations/
└── .tutorial/        # 教學文件
```

## 教學文件

想快速了解整個專案，從這邊看：

- `.tutorial/basic/`
- `.tutorial/backend/`
- `.tutorial/frontend/`
- `.tutorial/rag/`
- `.tutorial/database/`

## 安全提醒

- 不要把 `backend/.env`、`frontend/.env` 推上遠端
- `SUPABASE_SERVICE_ROLE_KEY` 只能放後端，不能出現在前端
