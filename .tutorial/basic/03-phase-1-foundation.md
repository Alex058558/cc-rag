# Phase 1 詳解：專案基礎建設

## 目標

先講白話版：Phase 1 就是在做「能跑、能登入、資料不會亂看」的最小可用底座。

正式一點說，Phase 1 的目標是把「可安全運作的全端骨架」先搭起來，包含：

- 前端可登入並保護頁面
- 後端可驗證 JWT 並提供 API
- 資料庫與儲存空間有基本資料模型與權限隔離

如果把整個專案比喻成一棟大樓，Phase 1 就是地基、門禁和水電系統。外觀看起來還不華麗，但少了這層後面一定會出事。

## 功能清單（對應實作）

### 1) 後端 FastAPI 骨架

- `backend/main.py`：FastAPI 入口、路由掛載、CORS 設定
- `backend/config.py`：讀取環境變數（Pydantic Settings）
- `backend/database.py`：建立 Supabase client（一般權限 + 管理權限）

### 2) 認證與授權

- `backend/auth/middleware.py`：解析 Bearer token，取得當前使用者
- 核心概念：
  - `Authentication`：你是誰（登入身份）
  - `Authorization`：你能做什麼（權限範圍）

這兩個很常被混在一起。記法很簡單：

- Authentication = 先驗明正身
- Authorization = 再決定你能進哪扇門

### 3) 前端基礎框架

- `frontend/src/contexts/AuthContext.tsx`：全域登入狀態
- `frontend/src/pages/LoginPage.tsx`：登入/註冊 UI
- `frontend/src/components/Layout.tsx`：基本頁面骨架與導覽
- `frontend/src/App.tsx`：路由與受保護頁面

### 4) Supabase 基礎資料模型

- `conversations`：每次對話會話
- `messages`：對話裡的訊息
- 透過 migration 管理 schema，避免手動改資料庫造成環境不一致

### 5) Storage 與權限

- `supabase/migrations/004_storage_bucket.sql`：建立 `documents` bucket
- 搭配 RLS policy，確保使用者只能看到自己的檔案

## 關鍵名詞

### JWT

一種簽章 token，前端每次呼叫 API 都帶上它，後端用它確認使用者身份。

你可以把 JWT 想成「有時效的通行證」。過期了就要重新換票，不是壞掉，是安全機制。

### RLS (Row-Level Security)

「列級別」權限控制，資料庫會自動判斷每一筆資料能不能被讀/寫。

好處是你不用每個 query 都手刻 `where user_id = ...`，讓資料庫幫你守住底線。

### Migration

用 SQL 檔案描述資料庫結構變更，像 git commit 一樣可追蹤、可重現。

### CORS

瀏覽器安全機制，控制哪些網域能呼叫你的 API。

## 資料流（實際運作）

```text
使用者登入 -> 前端拿到 access token
-> 呼叫後端 API (Authorization: Bearer <token>)
-> 後端驗證 token
-> 後端用 user_id 操作資料 + RLS 再次保護
```

## 常見錯誤

### 1) 前端顯示已登入，但 API 還是 401

通常是 token 沒帶到 header，或 token 已過期。

先檢查 Network 面板最有效：看 `Authorization` header 有沒有真的送出去。

### 2) 查詢不到資料

先檢查 RLS policy 是否有放行對應 `user_id` 的條件。

很多時候不是資料不存在，而是被 policy 擋住了。

### 3) Storage 上傳成功但讀不到

通常是 bucket policy 沒設定完整（select/insert 權限缺一）。

## 完成判定

Phase 1 完成時，至少要滿足：

- 可登入/登出
- 受保護頁面未登入不能進
- API 可驗證身份
- 對話資料與檔案存取具備使用者隔離
