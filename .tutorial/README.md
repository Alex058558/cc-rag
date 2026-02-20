# CC-RAG 教學文件

這是 CC-RAG 專案的教學文件入口。文件按主題分類，可依學習需求選擇閱讀路徑。

## 建議閱讀路線

### 路線 A：按 Phase 順序（推薦新手）

先看主線了解全貌，遇到不懂的詞查名詞表。

1. [專案介紹](basic/01-intro.md)
2. [環境變數管理](basic/02-env.md)
3. [Phase 1 基礎建設](basic/03-phase-1-foundation.md)
4. [Phase 2 聊天與 LLM](basic/04-phase-2-chat-llm.md)
5. [Phase 3 文件管線](basic/05-phase-3-document-pipeline.md)
6. [Phase 4 RAG 聊天整合](basic/06-phase-4-rag-chat-integration.md)
7. [RAG 名詞表](basic/07-rag-glossary.md)（隨時查閱）

### 路線 B：按技術主題（已有基礎）

直接跳到你想深入的領域。

## 目錄索引

### basic/ — Phase 主線教學

| 檔案 | 內容 |
|------|------|
| [01-intro.md](basic/01-intro.md) | 專案介紹與架構圖 |
| [02-env.md](basic/02-env.md) | Pydantic Settings、.env 管理 |
| [03-phase-1-foundation.md](basic/03-phase-1-foundation.md) | JWT、RLS、Migration、CORS |
| [04-phase-2-chat-llm.md](basic/04-phase-2-chat-llm.md) | SSE 串流、Stateless API、Hook 分層 |
| [05-phase-3-document-pipeline.md](basic/05-phase-3-document-pipeline.md) | 文件上傳、Docling、Chunking、Embedding |
| [06-phase-4-rag-chat-integration.md](basic/06-phase-4-rag-chat-integration.md) | Tool Calling、Citation 渲染 |
| [07-rag-glossary.md](basic/07-rag-glossary.md) | 術語表（Agent、Chunk、Embedding、RAG...） |

### rag/ — RAG 專題深入

| 檔案 | 內容 |
|------|------|
| [01-concept.md](rag/01-concept.md) | RAG 核心概念、最小流程、常見誤解 |
| [02-sse-streaming.md](rag/02-sse-streaming.md) | SSE 實作（後端 StreamingResponse、前端 reader） |
| [03-document-pipeline.md](rag/03-document-pipeline.md) | 管線全解（Docling、Schema、API、踩坑紀錄） |
| [04-retrieval-tuning.md](rag/04-retrieval-tuning.md) | 三段式檢索實作（Prefetch、Heuristic Rerank、Dynamic Top-K）|

### backend/ — 後端技術

| 檔案 | 內容 |
|------|------|
| [01-fastapi-uvicorn.md](backend/01-fastapi-uvicorn.md) | FastAPI 與 Uvicorn 概念 |
| [02-llm-client.md](backend/02-llm-client.md) | AsyncOpenAI + Gemini 串接 |
| [03-chat-service.md](backend/03-chat-service.md) | Service 層職責與分層設計 |
| [04-agent-tools.md](backend/04-agent-tools.md) | Agent 層、Tool Calling、兩階段呼叫流程 |

### frontend/ — 前端技術

| 檔案 | 內容 |
|------|------|
| [01-stack.md](frontend/01-stack.md) | Vite、React、TypeScript、Tailwind、shadcn/ui |
| [02-react-hooks.md](frontend/02-react-hooks.md) | useChat hook 與串流處理 |
| [03-document-upload.md](frontend/03-document-upload.md) | useDocuments + FileDropZone + DocumentList |
| [04-citation-display.md](frontend/04-citation-display.md) | Citation 解析、Popover 引用顯示、SourceCard |

### database/ — 資料庫

| 檔案 | 內容 |
|------|------|
| [01-supabase.md](database/01-supabase.md) | Supabase 設定、API Key、Migration 執行 |
| [02-concepts.md](database/02-concepts.md) | SQL Migration、RLS、Trigger、pgvector |

## basic 與專題的關係

`basic/` 是主線摘要，說明每個 Phase 做了什麼、為什麼這樣做。

其他目錄（`rag/`、`backend/`、`frontend/`、`database/`）是專題深入，包含完整程式碼、SQL schema 和踩坑紀錄。

主線文件會連結到對應專題，不會重複同一段內容。
