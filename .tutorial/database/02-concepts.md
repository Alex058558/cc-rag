# 資料庫核心概念

## Migration

用 **SQL 腳本**來管理資料庫結構的版本控制。

```
001_initial_schema.sql  → 建立表格
002_vector_search.sql   → 新增功能
003_rls_policies.sql    → 新增權限
004_storage_bucket.sql  → 建立檔案儲存 bucket
005_message_sources.sql → 訊息引用來源持久化
006_hybrid_search.sql   → Hybrid Search（FTS + Vector + RRF）
```

每次改資料庫結構就新增一個檔案，團隊都能同步。

## SQL Migrations 說明

### 001_initial_schema.sql

建立**聊天相關的表格**：

| 表格 | 用途 |
|------|------|
| `conversations` | 對話（標題、創建時間） |
| `messages` | 訊息（用戶說的、AI 回覆的） |

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null default 'New Chat',
  created_at timestamptz not null default now()
);
```

### 002_vector_search.sql

建立 **RAG 核心功能**：

| 表格 | 用途 |
|------|------|
| `documents` | 上傳的檔案（PDF、Word 等） |
| `document_chunks` | 檔案內容的切片 + 向量 |

```sql
create table document_chunks (
  content text not null,
  embedding vector(768),  -- 存 AI 向量
  ...
);
```

還有一個 `match_documents()` 函數，用來做向量搜尋！

### 003_rls_policies.sql

設定 **RLS (Row Level Security)**，讓用戶只能存取自己的資料。

### 004_storage_bucket.sql

建立 `documents` Storage bucket（私有），搭配 RLS 確保使用者只能存取自己的檔案。

```sql
-- 建立私有 bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- Storage RLS: 用 foldername 第一段比對 user_id
create policy "Users can upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

上傳路徑設計為 `{user_id}/{content_hash}{ext}`，第一層資料夾就是 user_id，RLS 用 `storage.foldername()` 取第一段做比對。

### 005_message_sources.sql

在 `messages` 表新增 `sources jsonb`，把回答引用來源存下來。

用途：

- 切換對話後 citation 不會消失
- 前端可重建 `[1]` `[2]` 對應來源

### 006_hybrid_search.sql

新增 Full-Text Search + Vector Search 的融合查詢：

- `document_chunks.fts tsvector`
- `GIN` index（加速 FTS）
- trigger：`trg_document_chunks_fts`（內容變更時自動更新 `fts`）
- `hybrid_search(...)` function（用 RRF 合併排名）

簡化版流程：

```sql
semantic (vector rank)
full_text (ts_rank rank)
-> FULL OUTER JOIN by chunk id
-> RRF score = w1/(k+rank1) + w2/(k+rank2)
```

## RLS (Row Level Security)

**行級安全**，讓資料庫自動做權限控制。

```sql
-- 啟用 RLS
alter table messages enable row level security;

-- 只有自己的訊息能看
create policy "Users can view own messages"
  on messages for select
  using (auth.uid() = user_id);
```

這樣不用在程式碼裡寫「這是不是他的資料」，資料庫幫你搞定！

## Trigger（觸發器）

資料庫裡的**自動化規則**。

```sql
-- 每次 update conversations 時，自動更新 updated_at
create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
```

在 Hybrid Search 中也有 trigger：

```sql
create trigger trg_document_chunks_fts
before insert or update of content on document_chunks
for each row execute function update_document_chunks_fts();
```

## pgvector

PostgreSQL 的**向量搜尋 extension**。

```sql
-- 啟用
create extension if not exists vector;

-- 建立向量欄位
embedding vector(768),

-- 建立索引（加速搜尋）
create index on document_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

## Index（索引）

加速查詢的資料結構。

```sql
-- 一般索引
create index idx_messages_conversation_id on messages(conversation_id);

-- 向量索引
create index idx_embedding on document_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 全文索引
create index idx_document_chunks_fts
  on document_chunks using gin (fts);
```

沒有索引，查詢會很慢！
