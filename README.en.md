[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG is a full-stack project for hands-on RAG practice: upload documents, run vector retrieval, and show cited sources in chat answers.

## Current Features

- Chat with SSE streaming responses
- Document upload and background processing (Docling -> chunk -> embedding)
- Three-stage retrieval (Prefetch -> Heuristic Rerank -> Dynamic Top-K)
- Hybrid search (vector + full-text search + RRF) with vector-only fallback
- Source citations (`[1]`, `[2]`) with frontend popover preview
- Citation persistence: sources saved to database, preserved across conversation switches

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

Create `backend/.env`:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

The following RAG parameters have defaults and can be overridden as needed:

```env
RAG_PREFETCH_K=15
RAG_TOP_K_MAX=5
RAG_TOP_K_MIN=1
RAG_MIN_SIMILARITY=0.3
RAG_SIMILARITY_DROP_RATIO=0.6
RAG_HYBRID_ENABLED=true
RAG_RRF_K=60
RAG_FULL_TEXT_WEIGHT=1.0
RAG_SEMANTIC_WEIGHT=1.0
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `RAG_PREFETCH_K` | 15 | Number of candidate chunks to fetch from pgvector in the first stage |
| `RAG_TOP_K_MAX` | 5 | Maximum number of chunks returned to the LLM |
| `RAG_TOP_K_MIN` | 1 | Minimum number of chunks returned to the LLM |
| `RAG_MIN_SIMILARITY` | 0.3 | Candidates below this cosine similarity are discarded |
| `RAG_SIMILARITY_DROP_RATIO` | 0.6 | Dynamic cutoff: chunks are trimmed when similarity drops below top score multiplied by this ratio |
| `RAG_HYBRID_ENABLED` | true | Enable hybrid retrieval mode |
| `RAG_RRF_K` | 60 | RRF smoothing constant |
| `RAG_FULL_TEXT_WEIGHT` | 1.0 | Full-text branch weight |
| `RAG_SEMANTIC_WEIGHT` | 1.0 | Vector branch weight |

Tuning tips: for more precise answers, raise `RAG_MIN_SIMILARITY` or lower `RAG_TOP_K_MAX`; for higher recall, raise `RAG_PREFETCH_K` or lower `RAG_SIMILARITY_DROP_RATIO`.

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
5. `supabase/migrations/005_message_sources.sql`
6. `supabase/migrations/006_hybrid_search.sql`

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

To understand the project quickly, start here: [.tutorial/README.md](.tutorial/README.md)

Includes phase-by-phase guides, RAG deep dives, frontend/backend tech notes, and database concepts.

## Security Notes

- Do not push `backend/.env` or `frontend/.env` to remote
- `SUPABASE_SERVICE_ROLE_KEY` must stay in backend only, never frontend
