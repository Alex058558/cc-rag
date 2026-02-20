[![繁體中文](https://img.shields.io/badge/lang-繁體中文-blue.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-red.svg)](README.en.md)
[![日本語](https://img.shields.io/badge/lang-日本語-ff69b4.svg)](README.ja.md)

# CC-RAG

CC-RAG は、RAG を実践的に学ぶためのフルスタックプロジェクトです。ドキュメントをアップロードし、ベクトル検索を行い、チャット回答に出典を表示します。

## 現在の機能

- SSE ストリーミング付きチャット
- ドキュメントのアップロードとバックグラウンド処理（Docling -> chunk -> embedding）
- 三段階検索（Prefetch -> Heuristic Rerank -> Dynamic Top-K）
- 出典引用（`[1]`, `[2]`）とフロントエンドの popover プレビュー
- 引用の永続化：出典がデータベースに保存され、会話を切り替えても維持される

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

`backend/.env` を作成してください：

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
FRONTEND_URL=http://localhost:5173
```

以下の RAG パラメータにはデフォルト値があり、必要に応じて上書きできます：

```env
RAG_PREFETCH_K=15
RAG_TOP_K_MAX=5
RAG_TOP_K_MIN=1
RAG_MIN_SIMILARITY=0.3
RAG_SIMILARITY_DROP_RATIO=0.6
```

| パラメータ | デフォルト | 説明 |
|------------|-----------|------|
| `RAG_PREFETCH_K` | 15 | 第一段階で pgvector から取得する候補 chunk 数 |
| `RAG_TOP_K_MAX` | 5 | LLM に渡す最大 chunk 数 |
| `RAG_TOP_K_MIN` | 1 | LLM に渡す最小 chunk 数 |
| `RAG_MIN_SIMILARITY` | 0.3 | cosine similarity がこの値未満の候補は除外 |
| `RAG_SIMILARITY_DROP_RATIO` | 0.6 | 動的カットオフ：similarity が最高スコアにこの比率を掛けた値を下回ると切り捨て |

チューニングのヒント：より正確な回答には `RAG_MIN_SIMILARITY` を上げるか `RAG_TOP_K_MAX` を下げてください。より高い再現率には `RAG_PREFETCH_K` を上げるか `RAG_SIMILARITY_DROP_RATIO` を下げてください。

フロントエンドの `frontend/.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

### 2) Supabase migrations を適用

Supabase SQL Editor で以下を順番に実行してください：

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_vector_search.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_storage_bucket.sql`
5. `supabase/migrations/005_message_sources.sql`

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

プロジェクト全体を素早く把握するなら：[.tutorial/README.md](.tutorial/README.md)

Phase 別メインガイド、RAG 専門解説、フロントエンド/バックエンド技術説明、データベース概念を含みます。

## セキュリティ注意

- `backend/.env` と `frontend/.env` をリモートへ push しないでください
- `SUPABASE_SERVICE_ROLE_KEY` はバックエンド専用です。フロントエンドには置かないでください
