[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG is a full-stack project for hands-on RAG practice: upload documents, run vector retrieval, and show cited sources in chat answers.

## Current Features

- Chat with SSE streaming responses
- Document upload and background processing (Docling -> chunk -> embedding)
- Supabase pgvector retrieval
- Source citations (`[1]`, `[2]`) with frontend popover preview

## Tech Stack

| Layer | Technology |
|------|------|
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | FastAPI + Python + Uvicorn |
| Database | Supabase (PostgreSQL + Auth + pgvector + Storage) |
| LLM | Gemini (OpenAI-compatible API) |
| Document Parsing | Docling |

## Quick Start

### 1) Prepare environment variables

This repo currently does not include `backend/.env.example`, so create `backend/.env` manually:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

Frontend `frontend/.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

### 2) Apply Supabase migrations

Run these in Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_vector_search.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_storage_bucket.sql`

### 3) Start backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend runs at `http://localhost:8000`.

## Development Notes

- Vite 7 recommends Node >= `20.19` (older versions may still run, but upgrading is recommended)
- If you use `mise`:

```bash
mise install node@20.19
mise use node@20.19
```

## Project Structure (Simplified)

```text
cc-rag/
├── backend/
│   ├── agent/        # tool calling and RAG response flow
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
└── .tutorial/        # tutorial docs
```

## Tutorial Docs

To understand the project quickly, start here:

- `.tutorial/basic/`
- `.tutorial/backend/`
- `.tutorial/frontend/`
- `.tutorial/rag/`
- `.tutorial/database/`

## Security Notes

- Do not push `backend/.env` or `frontend/.env` to remote
- `SUPABASE_SERVICE_ROLE_KEY` must stay in backend only, never frontend
