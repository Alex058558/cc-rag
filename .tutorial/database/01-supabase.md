# Supabase 使用教學

## 什麼是 Supabase？

Supabase 是一個開源的 Firebase 替代品，提供：

| 功能       | 說明                |
|------------|---------------------|
| PostgreSQL | 傳統關聯式資料庫    |
| pgvector   | 向量搜尋（RAG 核心！） |
| Auth       | 用戶註冊/登入       |
| Storage    | 檔案儲存（PDF 等）    |

## 建立專案

1. 去 [supabase.com](https://supabase.com) 登入
2. 點 `New project`
3. 設定：
   - **Name** - 專案名稱
   - **Password** - 資料庫密碼（自己記住就好，不用寫在程式碼）
   - **Region** - 選 `Northeast Asia (Tokyo)`

## 取得 API Keys

1. 點左側齒輪 **Settings** → **API**
2. 複製：
   - **Project URL**
   - **anon public key**
   - **service_role secret**

## 設定環境變數

### 後端 `.env`

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 前端 `.env`

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 執行 Migration

在 Supabase 後台 → **SQL Editor**，按順序執行：

1. [`supabase/migrations/001_initial_schema.sql`](../../supabase/migrations/001_initial_schema.sql) - 建立 conversations + messages 表
2. [`supabase/migrations/002_vector_search.sql`](../../supabase/migrations/002_vector_search.sql) - 建立 documents + document_chunks + 向量搜尋
3. [`supabase/migrations/003_rls_policies.sql`](../../supabase/migrations/003_rls_policies.sql) - 設定權限
4. [`supabase/migrations/004_storage_bucket.sql`](../../supabase/migrations/004_storage_bucket.sql) - 建立檔案儲存 bucket
5. [`supabase/migrations/005_message_sources.sql`](../../supabase/migrations/005_message_sources.sql) - messages 表新增 `sources` JSONB（citation 持久化）
6. [`supabase/migrations/006_hybrid_search.sql`](../../supabase/migrations/006_hybrid_search.sql) - 新增 `fts`、GIN index、`hybrid_search()`（RRF 融合）

如果改用 CLI，也可以在專案根目錄執行：

```bash
supabase db push
```

前提是先完成 `supabase login` 與 `supabase link --project-ref <ref>`。

## 在 Python 後端使用

```python
from backend.database import get_supabase_client

supabase = get_supabase_client()

# 查詢
messages = supabase.table("messages").select("*").execute()

# 插入
supabase.table("messages").insert({
    "conversation_id": "xxx",
    "role": "user",
    "content": "Hello!"
}).execute()
```

## 在前端使用

```typescript
import { supabase } from './lib/supabase'

// 登入
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// 查詢
const { data } = await supabase
  .from('messages')
  .select('*')
```

## 常見問題

### Q: 需要資料庫密碼嗎？

不需要！應用程式透過 API Key 訪問，不需要資料庫密碼。

### Q: anon key vs service_role key？

- **anon** - 一般用戶，會被 RLS 擋
- **service_role** - 管理員，繞過 RLS（後端用，別前端用！）
