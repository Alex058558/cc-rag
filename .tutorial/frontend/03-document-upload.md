# 文件上傳介面

## 概述

Phase 3 新增了文件匯入頁面，包含三個元件 + 一個 Hook。

```
ImportPage
  ├── FileDropZone    — 拖拽上傳區
  ├── ProcessingStatus — 處理中 banner
  └── DocumentList    — 文件清單
        hooks/useDocuments — 狀態管理
```

---

## useDocuments Hook

`hooks/useDocuments.ts` 管理文件列表的所有狀態。

### 提供什麼？

```typescript
const {
  documents,   // Document[]
  loading,     // 初次載入中
  uploading,   // 上傳中
  error,       // 錯誤訊息
  upload,      // (file: File) => Promise<void>
  deleteDoc,   // (id: string) => void
  refetch,     // 手動重新載入
} = useDocuments()
```

### 自動 Polling

有文件正在處理時（status 為 `pending` 或 `processing`），每 3 秒自動重新 fetch：

```typescript
useEffect(() => {
  const hasActive = documents.some(
    (d) => d.status === 'processing' || d.status === 'pending',
  )
  if (!hasActive) return
  const timer = setInterval(fetchDocuments, 3000)
  return () => clearInterval(timer)
}, [documents, fetchDocuments])
```

`hasActive` 變 `false`（全部 completed/failed）後，interval 自動清除。

### 上傳用 FormData，不能用 apiFetch

`apiFetch` 會設定 `Content-Type: application/json`，但上傳檔案要用 `multipart/form-data`。讓瀏覽器自動設定 Content-Type（含 boundary）：

```typescript
const formData = new FormData()
formData.append('file', file)

// 不帶 Content-Type header，瀏覽器會自動填
const res = await fetch(`${API_BASE}/api/documents`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})
```

---

## FileDropZone 元件

處理兩種上傳方式：

### 拖拽

```tsx
onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
onDragLeave={() => setDragging(false)}
onDrop={async (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file) await onUpload(file)
}}
```

`e.preventDefault()` 在 `onDragOver` 裡很重要，沒有它瀏覽器會用預設行為（開啟檔案），drop 事件就觸發不了。

### Click to Upload

```tsx
const inputRef = useRef<HTMLInputElement>(null)

<input ref={inputRef} type="file" className="sr-only" onChange={handleChange} />
<div onClick={() => inputRef.current?.click()}>...</div>
```

用隱藏的 `<input type="file">` + ref trigger，讓整個 div 都可以點擊開啟檔案選擇。

---

## DocumentList 元件

### Status Badge 顏色

```typescript
const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
}
```

### 處理中不能刪除

```tsx
<Button
  disabled={doc.status === 'processing'}
  onClick={() => onDelete(doc.id)}
>
```

避免 race condition：文件還在寫入 chunks 時就刪掉 document record。

---

## 相關檔案

| 檔案 | 用途 |
|------|------|
| `hooks/useDocuments.ts` | 狀態管理 + polling |
| `components/import/FileDropZone.tsx` | 拖拽上傳 |
| `components/import/DocumentList.tsx` | 文件清單 |
| `components/import/ProcessingStatus.tsx` | 處理中提示 |
| `pages/ImportPage.tsx` | 組裝頁面 |
