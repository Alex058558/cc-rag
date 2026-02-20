# 專案總結：從零手刻 RAG 學到的事

## 這個專案做了什麼

CC-RAG 是一個從零開始實作的 RAG（Retrieval-Augmented Generation）聊天應用。不用 LangChain、不用 LlamaIndex，全部手動串接：FastAPI 後端、React 前端、Supabase 資料庫、Gemini LLM，加上自己寫的 embedding、chunking、三段式檢索、tool calling、citation 顯示。

四個 Phase 跑完，涵蓋了一個 RAG 應用從骨架到可用的完整過程。

## 手動實作 vs 框架：我們自己做了什麼

| RAG 環節 | 框架通常幫你做的 | 我們自己寫的 |
|----------|----------------|-------------|
| Document Loading | `DirectoryLoader` 一行搞定 | Docling 解析 + Storage 上傳 + 中文檔名 workaround |
| Chunking | `RecursiveCharacterTextSplitter` | 手寫 `chunk_text()` + overlap 邏輯 |
| Embedding | `OpenAIEmbeddings()` 一行 | 直接呼叫 Gemini API + batch 處理 + 維度控制 |
| Vector Store | `Chroma.from_documents()` | pgvector + 自寫 SQL function + RLS |
| Retrieval | `retriever.get_relevant_documents()` | 三段式：prefetch → heuristic rerank → dynamic top-k |
| LLM Integration | `ChatOpenAI()` + chain | AsyncOpenAI SDK → Gemini + SSE streaming |
| Agent / Tools | `create_react_agent()` | 手寫 tool calling loop + function schema |
| Citation | 框架通常不管這塊 | 自己解析 `[1][2]` + sources 持久化 + 前端 popover |

重點不是「框架不好」，而是自己走一遍才知道每個環節在幹嘛。

## 每個 Phase 學到的核心技術

### Phase 1：專案基礎建設

- **Supabase 作為 BaaS** -- Auth、PostgreSQL、Storage、RLS 一站搞定
- **SQL Migration 管理** -- 用 `.sql` 檔版控 schema 變更，不靠 ORM
- **JWT 驗證** -- 後端 middleware 解 token，前端 Supabase client 自動帶
- **RLS（Row Level Security）** -- 資料庫層級的權限控制，不只靠後端邏輯
- **前端腳手架** -- Vite + React + TypeScript + Tailwind + shadcn/ui 的組合

### Phase 2：聊天介面 + LLM 串接

- **SSE（Server-Sent Events）** -- 單向串流，比 WebSocket 簡單，適合 LLM 逐字輸出
- **FastAPI StreamingResponse** -- `async generator` + `yield` 的串流模式
- **前端串流解析** -- `ReadableStream` + `TextDecoder` 逐字更新 UI
- **OpenAI SDK 接 Gemini** -- `base_url` 換掉就能用，但有些欄位行為不同（像 `index` 是 `None`）
- **Stateless API 設計** -- 每次請求帶 conversation_id，不在伺服器存 session

### Phase 3：文件匯入 + 處理管線

- **Docling** -- 比 PyPDF2 強的文件解析，輸出 Markdown 保留結構
- **Chunking 策略** -- chunk_size、overlap 的取捨；太大失去精準度，太小失去語境
- **Embedding 維度** -- text-embedding-004 支援 256-3072 維，用 768 平衡效能與品質
- **pgvector** -- PostgreSQL 原生向量搜尋，不需要額外 vector DB
- **內容去重** -- SHA256 hash 防止同一份文件重複處理
- **同步函式跑在 async 裡** -- `run_in_executor` 避免 block event loop

### Phase 4：RAG 檢索 + 聊天整合

- **Tool Calling** -- LLM 決定要不要查資料、查什麼，不是每次都查
- **三段式檢索** -- prefetch 多撈 → heuristic rerank 重排 → dynamic top-k 截斷
- **Heuristic Rerank** -- 不用外部模型，用 similarity + keyword coverage + structure bonus
- **Dynamic Top-K** -- 根據分數分佈自動決定回幾筆，不寫死
- **Citation 持久化** -- sources 存 JSONB，切換對話不丟引用
- **System Prompt 工程** -- 引導 LLM 用 `[1][2]` 格式引用，避免搬原文獻編號

## 踩過的重要坑

### 1. Supabase Storage 不吃中文檔名

Storage object key 只接受 ASCII。解法：key 用 `{hash}{ext}`，原始檔名只存 DB。

### 2. Gemini Embedding 回傳的 index 是 None

用 OpenAI SDK 打 Gemini，`response.data[i].index` 是 `None`。不能 sort by index，直接按回傳順序取。

### 3. Docling 是同步的

`DocumentConverter.convert()` 會 block event loop。要用 `ThreadPoolExecutor` + `run_in_executor` 包起來。

### 4. LLM 會搬原文獻的編號

如果 chunk 裡有 `[1]`、`[2]`，LLM 可能直接照抄而不是用我們的來源索引。解法：在 system prompt 明確規定引用格式規則。

### 5. pgvector cosine similarity 不是萬能的

純向量搜尋對關鍵詞匹配不敏感。加 heuristic rerank 的 keyword coverage 之後，特定問題的檢索品質明顯提升。

## 自己做 vs 用框架：什麼時候該選哪個

### 自己做適合

- **學習目的** -- 想搞懂 RAG 每個環節的原理
- **高度客製化** -- 框架的抽象不符合需求（例如自訂 rerank 邏輯）
- **輕量部署** -- 不想拉一堆 dependency
- **除錯能力** -- 出問題時知道是哪一層壞了

### 用框架適合

- **快速驗證** -- 先確認 idea 可行，再決定要不要深入
- **標準流程** -- 你的需求跟框架預設的很像
- **團隊協作** -- 統一的介面降低溝通成本
- **生態整合** -- 需要接很多不同 vector DB、LLM provider

### 實際觀察

走完這個專案之後，回去看 LangChain 的 `RetrievalQA` chain，會更清楚它裡面做了什麼、省了什麼、隱藏了什麼。這就是手刻一次的價值。

## 這份練習之後可以帶走的能力

1. **看到 RAG 架構圖就知道每個方塊在幹嘛** -- 不再是黑箱
2. **能自己調檢索品質** -- 知道 prefetch、rerank、top-k 各自的作用，可以針對性優化
3. **SSE 串流實作** -- 前後端都會寫，不限於 RAG 場景
4. **Tool Calling 模式** -- 理解 LLM agent 怎麼決策，可以加更多 tool
5. **Supabase 全套操作** -- Auth、RLS、pgvector、Storage、Migration
6. **Debug 能力** -- 知道問題可能出在哪一層（embedding? retrieval? prompt? 前端解析?）
7. **評估框架的眼光** -- 用過手刻版，才能判斷框架省了什麼、犧牲了什麼

## 對應文件

- [01-concept.md](01-concept.md) -- RAG 核心概念
- [02-sse-streaming.md](02-sse-streaming.md) -- SSE 串流實作
- [03-document-pipeline.md](03-document-pipeline.md) -- 文件處理管線
- [04-retrieval-tuning.md](04-retrieval-tuning.md) -- 三段式檢索調參
