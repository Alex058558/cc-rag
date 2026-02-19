# Phase 3 詳解：文件匯入與向量化管線

## 目標

先講直覺版：Phase 3 在做的事，就是把「丟進來的檔案」加工成「可以被問答系統快速查到的知識片段」。

正式來說，Phase 3 的核心是把「原始文件」變成「可檢索知識」。

流程分成五步：

1. 上傳檔案
2. 解析文本
3. 切 chunk
4. 產生 embedding
5. 寫入資料庫與向量欄位

## 功能清單（對應實作）

### 後端

- `backend/routes/documents.py`：上傳、列表、刪除 API
- `backend/services/document_processor.py`：Docling 解析與 chunking
- `backend/services/embedding.py`：呼叫 embedding 模型
- `backend/services/record_manager.py`：去重、入庫、狀態更新

### 前端

- `frontend/src/pages/ImportPage.tsx`
- `frontend/src/components/import/FileDropZone.tsx`
- `frontend/src/components/import/DocumentList.tsx`
- `frontend/src/components/import/ProcessingStatus.tsx`
- `frontend/src/hooks/useDocuments.ts`

### 資料庫

- `documents`：文件 metadata（檔名、狀態、hash）
- `document_chunks`：切塊內容 + 向量

## 關鍵名詞

### Chunk

把長文切成小段，讓檢索能以段落為單位命中。

如果不切 chunk，模型每次都得吃整份文件，慢、貴、而且很難精準對焦。

### Overlap

相鄰 chunk 的重疊區，避免關鍵句剛好被切斷。

這個看起來很小，但常常是檢索品質的分水嶺。

### Embedding

把文字轉成向量。語意越接近，向量距離越近。

### Content Hash

用檔案內容計算 SHA-256，避免重複上傳相同檔案後重複計算成本。

## 狀態機（documents.status）

```text
pending -> processing -> completed
                   \-> failed
```

- `pending`：剛建立文件紀錄
- `processing`：背景任務處理中
- `completed`：切塊與向量化完成
- `failed`：解析或向量化失敗

## 實作細節

### 1) 為什麼上傳要用 FormData

JSON 不適合二進位檔案，`multipart/form-data` 才是檔案上傳標準做法。

### 2) 為什麼 Docling 要丟執行緒池

Docling 轉檔是同步 CPU/IO 工作，直接在 async event loop 跑會阻塞請求。

### 3) 為什麼 chunk 長度是 1500 / overlap 150

這是精度與成本的折衷：

- chunk 太短：上下文不足
- chunk 太長：檢索顆粒太粗，命中不精準

這組參數不是唯一答案，但在目前文件類型和問答型態下是可用的平衡點。

## 常見錯誤

### 1) 中文檔名上傳失敗

Storage object key 僅用 ASCII：`{user_id}/{content_hash}{ext}`。

### 2) embedding 維度不一致

`document_chunks.embedding` 是 `vector(768)`，模型輸出維度需一致。

### 3) 文件顯示 completed 但查不到 chunk

檢查是否有 transaction 中斷或 `record_manager` 寫入流程提早返回。

另外也要看是不是查錯 `user_id`，RLS 會讓你以為資料不見，其實只是被擋住。

## 完成判定

Phase 3 完成時，至少要滿足：

- PDF/DOCX 可上傳
- `documents` 與 `document_chunks` 都有資料
- 相同檔案重傳可觸發去重
- 前端能看到狀態從 processing 轉 completed
