# 文件處理管線

## 概述

Phase 3 實作了文件上傳、解析、切塊、向量化的完整管線。

```
上傳 PDF
    ↓
Docling 解析成 Markdown
    ↓
切分成 Chunks（重疊文字塊）
    ↓
Embedding 模型轉向量
    ↓
存入 Supabase
```

## 核心元件

### 1. 文件解析 - Docling

`backend/services/document_processor.py`

```python
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert(file_path)
markdown_text = result.document.export_to_markdown()
```

**Docling 特色：**
- 支援 PDF、Word、HTML 等多種格式
- 輸出 Markdown，保留文件結構
- 比 PyPDF2、pdfplumber 更強的版面識別能力

### 2. 文字切塊 - Chunking

為什麼要切塊？

```
原文：這是一個很長的文件，包含很多段落...
切塊：
  Chunk 1: 「第一章：介紹...」（1500 字）
  Chunk 2: 「...第二章：安裝...」（1500 字）
  Chunk 3: 「...」（重疊 150 字）
```

**參數設定：**
| 參數 | 值 | 說明 |
|------|-----|------|
| CHUNK_SIZE | 1500 | 每個 chunk 最長字元數 |
| CHUNK_OVERLAP | 150 |  相鄰 chunk 重疊字元數 |

**為什麼要重疊？**
- 確保重要資訊不會被切斷
- 改善搜尋結果的上下文連貫性

### 3. 向量化 - Embedding

`backend/services/embedding.py`

```python
response = await client.embeddings.create(
    model="text-embedding-004",
    input=texts,
    dimensions=768,  # 降維相容 pgvector 索引
)
```

**維度選擇：**
- text-embedding-004 支援 256-3072 維
- 使用 768 維相容 Supabase pgvector 索引限制
- 降維不影響檢索品質

### 4. 儲存 - Supabase

**documents 表（文件 metadata）**

```sql
create table documents (
  id uuid primary key,
  user_id uuid references auth.users,
  filename text,
  file_type text,
  file_size int,
  storage_path text,
  content_hash text,     -- SHA256，去重用
  status text,          -- pending → processing → completed/failed
  chunk_count int,
  created_at timestamptz
);
```

**document_chunks 表（實際內容 + 向量）**

```sql
create table document_chunks (
  id uuid primary key,
  document_id uuid references documents,
  user_id uuid references auth.users,
  chunk_index int,      -- 第幾個 chunk
  content text,         -- 文字內容
  embedding vector(768), -- AI 向量
  metadata jsonb,
  created_at timestamptz
);
```

## API 端點

| 方法 | 路徑 | 功能 |
|------|------|------|
| POST | /api/documents | 上傳文件 |
| GET | /api/documents | 列表 |
| GET | /api/documents/:id | 詳情 |
| DELETE | /api/documents/:id | 刪除 |

### 上傳流程

```python
# 1. 檢查檔案類型
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/html",
}

# 2. 計算 hash（去重）
content_hash = sha256(file_bytes)

# 3. 存到 Storage
# 用 hash + 副檔名作為 key，原始檔名只存 DB
# Supabase Storage 不接受非 ASCII 字元（中文檔名會 400）
suffix = Path(filename).suffix.lower()
storage_path = f"{user_id}/{content_hash}{suffix}"
supabase.storage.from_("documents").upload(storage_path, file_bytes)

# 4. 寫入 metadata
db.table("documents").insert({
    "filename": filename,
    "content_hash": content_hash,
    "status": "pending",
})

# 5. 背景處理（Async）
background_tasks.add_task(_process_document, doc_id, file_bytes)
```

## 去重機制

透過 `content_hash`（SHA256）判斷：

```python
def find_duplicate(db, user_id, content_hash):
    result = db.table("documents").select("*").eq("user_id", user_id).eq("content_hash", content_hash).execute()
    return result.data[0] if result.data else None
```

同一個檔案上傳兩次，第二次會直接返回現有的 document，不會重新處理。

## 處理狀態

| 狀態 | 說明 |
|------|------|
| pending | 等待處理 |
| processing | 處理中（解析 + chunking + embedding）|
| completed | 成功 |
| failed | 失敗（查看後端 logs）|

## 常見問題

### Q: PDF 解析失敗怎麼辦？

檢查後端 logs：
```bash
# 會顯示 Docling 錯誤訊息
[doc_id] Processing failed: ...
```

可能原因：
- PDF 是掃描件（沒有文字層）
- PDF 損壞
- 檔案太大

### Q: chunks 數量為 0？

確保：
1. Docling 成功解析
2. chunk_text() 有產出
3. embedding 生成成功

查看後端 logs 會顯示各階段處理的狀態。

### Q: 向量維度錯誤？

```
expected 768 dimensions, not 3072
```

解決：確保 embedding.py 使用 `dimensions=768` 參數。

## 實作中踩到的坑

### 1. Supabase Storage 不接受中文檔名

**錯誤訊息：**
```
StorageApiError: Invalid key: {user_id}/{hash}/鋼琴訓練.pdf
```

**原因：** Storage object key 只接受 ASCII 字元。

**解法：** key 只用 `{hash}{ext}`，檔名只存在 DB 的 `filename` 欄位。

```python
# 壞的
storage_path = f"{user_id}/{hash}/{filename}"

# 好的
suffix = Path(filename).suffix.lower()
storage_path = f"{user_id}/{hash}{suffix}"
```

---

### 2. Gemini Embedding API 的 `index` 是 `None`

**錯誤訊息：**
```
TypeError: '<' not supported between instances of 'int' and 'NoneType'
```

**原因：** 用 OpenAI SDK 呼叫 Gemini embedding 時，回傳的物件 `index` 欄位為 `None`（OpenAI 有填，Gemini 沒填）。

**解法：** 直接取 `response.data`，不要 sort by index。

```python
# 壞的
sorted_items = sorted(response.data, key=lambda x: x.index)

# 好的（Gemini 本來就按順序回傳）
all_embeddings.extend(item.embedding for item in response.data)
```

---

### 3. Docling 是同步函式，不能直接在 async 裡跑

**問題：** Docling 的 `DocumentConverter.convert()` 是同步的，直接 await 會 block event loop。

**解法：** 用 `ThreadPoolExecutor` + `run_in_executor`：

```python
loop = asyncio.get_running_loop()
text = await loop.run_in_executor(executor, parse_document, file_bytes, filename)
```

---

## 相關檔案

```
backend/
├── routes/
│   └── documents.py      # API 端點
├── services/
│   ├── document_processor.py  # Docling + chunking
│   ├── embedding.py           # 向量化
│   └── record_manager.py      # 資料庫操作
```

## Phase 4 檢索調參（已完成）

文件切塊與向量化完成後，Phase 4 已實作檢索品質優化：

- 固定 `top_k` 升級為三段式檢索（Prefetch → Heuristic Rerank → Dynamic Top-K）
- 所有 RAG 參數可從 `.env` 配置
- Citation 來源持久化到 `messages.sources` JSONB

詳細實作說明見：[rag/04-retrieval-tuning.md](04-retrieval-tuning.md)
