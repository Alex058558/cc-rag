[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG 是一個用來練習 RAG 的全端專案：上傳文件、做向量檢索、在聊天中引用來源。

## 目前做到哪裡

- 聊天 + SSE 串流回覆
- 文件上傳與背景處理（Docling -> chunk -> embedding）
- 三段式檢索（Prefetch -> Heuristic Rerank -> Dynamic Top-K）
- 回答引用來源（`[1]`, `[2]`）與前端 popover 預覽
- Citation 持久化：引用來源存入資料庫，切換對話不遺失

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

建立 `backend/.env`：

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

以下 RAG 參數有預設值，可視需要覆蓋：

```env
RAG_PREFETCH_K=15
RAG_TOP_K_MAX=5
RAG_TOP_K_MIN=1
RAG_MIN_SIMILARITY=0.3
RAG_SIMILARITY_DROP_RATIO=0.6
```

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `RAG_PREFETCH_K` | 15 | 第一階段從 pgvector 撈多少候選 chunk |
| `RAG_TOP_K_MAX` | 5 | 最終回傳的最大 chunk 數 |
| `RAG_TOP_K_MIN` | 1 | 最終回傳的最小 chunk 數 |
| `RAG_MIN_SIMILARITY` | 0.3 | cosine similarity 低於此值的候選直接丟棄 |
| `RAG_SIMILARITY_DROP_RATIO` | 0.6 | 動態裁切比例：當 chunk 的 similarity 低於最高分乘以此值時截斷 |

調參建議：想要更精準的回答，調高 `RAG_MIN_SIMILARITY` 或調低 `RAG_TOP_K_MAX`；想要更高召回率，調高 `RAG_PREFETCH_K` 或調低 `RAG_SIMILARITY_DROP_RATIO`。

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
5. `supabase/migrations/005_message_sources.sql`

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

想快速了解整個專案，從這邊開始：[.tutorial/README.md](.tutorial/README.md)

包含 Phase 主線教學、RAG 專題深入、前後端技術說明、資料庫概念等。

## 安全提醒

- 不要把 `backend/.env`、`frontend/.env` 推上遠端
- `SUPABASE_SERVICE_ROLE_KEY` 只能放後端，不能出現在前端
