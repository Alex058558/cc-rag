[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG は、RAG を実践的に学ぶためのフルスタックプロジェクトです。ドキュメントをアップロードし、ベクトル検索を行い、チャット回答に出典を表示します。

## 現在の機能

- SSE ストリーミング付きチャット
- ドキュメントのアップロードとバックグラウンド処理（Docling -> chunk -> embedding）
- Supabase pgvector 検索
- 出典引用（`[1]`, `[2]`）とフロントエンドの popover プレビュー

## 技術スタック

| レイヤー | 技術 |
|------|------|
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | FastAPI + Python + Uvicorn |
| Database | Supabase (PostgreSQL + Auth + pgvector + Storage) |
| LLM | Gemini (OpenAI-compatible API) |
| Document Parsing | Docling |

## クイックスタート

### 1) 環境変数を準備

このリポジトリには現在 `backend/.env.example` がないため、`backend/.env` を手動で作成してください。

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

フロントエンドの `frontend/.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

### 2) Supabase migrations を適用

Supabase SQL Editor で以下を順番に実行してください。

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_vector_search.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_storage_bucket.sql`

### 3) バックエンド起動

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4) フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:5173`、バックエンドは `http://localhost:8000` で動作します。

## 開発メモ

- Vite 7 は Node >= `20.19` を推奨（古いバージョンでも動く場合がありますが、更新推奨）
- `mise` を使う場合:

```bash
mise install node@20.19
mise use node@20.19
```

## プロジェクト構成（簡易版）

```text
cc-rag/
├── backend/
│   ├── agent/        # tool calling と RAG 応答フロー
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
└── .tutorial/        # チュートリアル資料
```

## チュートリアル資料

全体を素早く把握するなら、まず以下を確認してください。

- `.tutorial/basic/`
- `.tutorial/backend/`
- `.tutorial/frontend/`
- `.tutorial/rag/`
- `.tutorial/database/`

## セキュリティ注意

- `backend/.env` と `frontend/.env` をリモートへ push しないでください
- `SUPABASE_SERVICE_ROLE_KEY` はバックエンド専用です。フロントエンドには置かないでください
