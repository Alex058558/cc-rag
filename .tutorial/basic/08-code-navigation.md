# 程式碼導覽地圖

這份文件是給 GitHub 網頁閱讀時使用的「快速跳轉地圖」。

用法：

1. 先看教學章節
2. 再點這裡的路徑跳到對應程式碼
3. 回到教學比對「為什麼這樣做」

## Phase 1：基礎建設

- 後端入口：[`backend/main.py`](../../backend/main.py)
- 設定管理：[`backend/config.py`](../../backend/config.py)
- 資料庫 client：[`backend/database.py`](../../backend/database.py)
- Auth middleware：[`backend/auth/middleware.py`](../../backend/auth/middleware.py)
- 前端 Auth Context：[`frontend/src/contexts/AuthContext.tsx`](../../frontend/src/contexts/AuthContext.tsx)
- Login Page：[`frontend/src/pages/LoginPage.tsx`](../../frontend/src/pages/LoginPage.tsx)
- Supabase 基礎 schema：[`supabase/migrations/001_initial_schema.sql`](../../supabase/migrations/001_initial_schema.sql)

## Phase 2：聊天與串流

- Chat 路由：[`backend/routes/chat.py`](../../backend/routes/chat.py)
- Chat service：[`backend/services/chat.py`](../../backend/services/chat.py)
- LLM client：[`backend/llm/client.py`](../../backend/llm/client.py)
- 前端串流 hook：[`frontend/src/hooks/useChat.ts`](../../frontend/src/hooks/useChat.ts)
- 訊息列表：[`frontend/src/components/chat/MessageList.tsx`](../../frontend/src/components/chat/MessageList.tsx)

## Phase 3：文件處理管線

- 文件路由：[`backend/routes/documents.py`](../../backend/routes/documents.py)
- 文件處理：[`backend/services/document_processor.py`](../../backend/services/document_processor.py)
- 向量化：[`backend/services/embedding.py`](../../backend/services/embedding.py)
- 去重與記錄管理：[`backend/services/record_manager.py`](../../backend/services/record_manager.py)
- 向量搜尋 schema：[`supabase/migrations/002_vector_search.sql`](../../supabase/migrations/002_vector_search.sql)

## Phase 4：RAG 檢索整合

- 檢索主流程：[`backend/services/retrieval.py`](../../backend/services/retrieval.py)
- Agent tool calling：[`backend/agent/agent.py`](../../backend/agent/agent.py)
- Tool 定義：[`backend/agent/tools.py`](../../backend/agent/tools.py)
- Citation 持久化 migration：[`supabase/migrations/005_message_sources.sql`](../../supabase/migrations/005_message_sources.sql)
- Hybrid search migration：[`supabase/migrations/006_hybrid_search.sql`](../../supabase/migrations/006_hybrid_search.sql)

## 前端引用顯示

- Citation 元件：[`frontend/src/components/chat/Citation.tsx`](../../frontend/src/components/chat/Citation.tsx)
- SourceCard：[`frontend/src/components/chat/SourceCard.tsx`](../../frontend/src/components/chat/SourceCard.tsx)

## 評測與學習文件

- 評測集：[`eval/EVAL_PIANO_V1.yaml`](../../eval/EVAL_PIANO_V1.yaml)
- RAG 核心概念：[`rag/01-concept.md`](../rag/01-concept.md)
- 檢索調參：[`rag/04-retrieval-tuning.md`](../rag/04-retrieval-tuning.md)
- Hybrid 實作：[`rag/06-hybrid-search.md`](../rag/06-hybrid-search.md)

## 小提醒

- 如果檔案路徑改了，記得同步更新這份地圖
- 新增教學章節時，建議一併補上對應程式碼入口
