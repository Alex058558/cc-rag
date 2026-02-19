# 資料庫核心概念

## Migration

用 **SQL 腳本**來管理資料庫結構的版本控制。

```
001_initial_schema.sql  → 建立表格
002_vector_search.sql   → 新增功能
003_rls_policies.sql    → 新增權限
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
```

沒有索引，查詢會很慢！
