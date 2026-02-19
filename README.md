# CC-RAG

一個基於 RAG（檢索增強生成）的 AI 聊天應用，讓你可以上傳文件並基於文件內容進行對話。

## 技術堆疊

| 層面 | 技術 |
|------|------|
| 前端 | React + TypeScript + Vite + Tailwind + shadcn/ui |
| 後端 | FastAPI + Python + Uvicorn |
| 資料庫 | Supabase (PostgreSQL + Auth + pgvector) |
| LLM | Gemini 2.5 Flash |

## 環境設定

### 1. 複製環境變數

```bash
cp backend/.env.example backend/.env
```

### 2. 填入 Supabase 資訊

在 [Supabase Dashboard](https://supabase.com/dashboard) 取得：

| 變數 | 說明 |
|------|------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role secret |
| `GEMINI_API_KEY` | Google AI Studio → API Key |

### 3. 執行 SQL Migrations

在 Supabase SQL Editor 中依序執行：

1. `supabase/migrations/001_conversations.sql` - 對話表
2. `supabase/migrations/002_vector_search.sql` - 向量搜尋函數
3. `supabase/migrations/003_documents.sql` - 文件表（Phase 3 用）

---

## 啟動開發伺服器

### 後端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

後端運作在：http://localhost:8000

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端運作在：http://localhost:5173

---

## Phase 2 測試指南

### 測試項目

1. **用戶登入** - 使用 Supabase 帳號登入
2. **建立對話** - 點擊「New Chat」建立新對話
3. **發送訊息** - 輸入訊息，測試 SSE 串流回應
4. **歷史保存** - 重新整理頁面，对话历史是否保留
5. **對話列表** - 側邊欄是否顯示所有對話
6. **刪除對話** - 測試刪除功能

### 測試步驟

1. 啟動後端 `uvicorn main:app --reload --port 8000`
2. 啟動前端 `npm run dev`
3. 打開瀏覽器 http://localhost:5173
4. 點擊「Login with Email」或使用 Magic Link
5. 登入後點擊「New Chat」
6. 輸入任何問題，例如：「你好，請自我介绍一下」
7. 觀察：
   - [ ] 訊息是否立即顯示（使用者訊息）
   - [ ] AI 回應是否逐字顯示（串流效果）
   - [ ] 對話標題是否自動生成
8. 重新整理頁面，確認對話歷史仍在
9. 建立多個對話，確認側邊欄列表正確

### API 測試（可選）

```bash
# 測試登入後的 API
curl -X GET http://localhost:8000/api/conversations \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 專案結構

```
cc-rag/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py             # 環境變數
│   ├── database.py           # Supabase 客戶端
│   ├── auth/
│   │   └── middleware.py     # JWT 驗證
│   ├── routes/
│   │   └── chat.py           # 聊天 API
│   ├── services/
│   │   └── chat.py           # 聊天邏輯
│   └── llm/
│       └── client.py         # Gemini 客戶端
├── frontend/
│   ├── src/
│   │   ├── pages/            # 頁面
│   │   ├── components/      # UI 元件
│   │   ├── hooks/           # React Hooks
│   │   ├── contexts/        # React Context
│   │   └── lib/             # 工具函數
│   └── index.html
└── supabase/
    └── migrations/           # SQL 腳本
```

---

## 常見問題

### Q: 登入後顯示錯誤？

檢查瀏覽器 Console：
- CORS 錯誤 → 確認 `config.py` 的 `frontend_url` 正確
- 401 錯誤 → 確認 JWT token 正確

### Q: 發送訊息沒有回應？

1. 檢查後端是否正常運作（http://localhost:8000/docs）
2. 檢查 `GEMINI_API_KEY` 是否正確
3. 檢查瀏覽器 Console 錯誤訊息

### Q: TypeScript 錯誤？

```bash
cd frontend
npx tsc --noEmit
```

---

## 相關教學文件

`.tutorial/` 目錄下有詳細的技術教學：

- `.tutorial/basic/` - 專案介紹、環境設定
- `.tutorial/backend/` - FastAPI、LLM 串接
- `.tutorial/frontend/` - React、Hooks
- `.tutorial/rag/` - RAG 概念、SSE 串流
- `.tutorial/database/` - Supabase、pgvector
