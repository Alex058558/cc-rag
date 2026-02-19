# 引用來源顯示

## 概述

Phase 4 讓聊天回答能夠引用文件來源。前端需要做三件事：

1. 接收 `sources` 事件，綁定到對應訊息
2. 解析回答文字中的 `[1]`、`[2]` 標記
3. 渲染可互動的引用元件（點擊可看來源 chunk）

## 檔案對應

| 檔案 | 職責 |
|------|------|
| `hooks/useChat.ts` | 接收 SSE `sources` 事件，存入 Message |
| `components/chat/MessageList.tsx` | 解析 `[n]` 標記，替換為 Citation 元件 |
| `components/chat/Citation.tsx` | 引用按鈕 + Popover 顯示來源詳情 |
| `components/chat/SourceCard.tsx` | 來源卡片（用於列表預覽） |

## Source 資料結構

```typescript
interface Source {
  id: string
  document_id: string
  filename: string
  content: string       // chunk 完整文字
  chunk_index: number
  similarity: number    // 0-1 之間的相似度分數
}
```

來源資料從後端 `sources` SSE 事件取得，在 `useChat` 裡綁到 assistant message：

```typescript
if (data.sources) {
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId ? { ...m, sources: data.sources } : m,
    ),
  )
}
```

## Citation 解析流程

MessageList 裡的解析分三層：

### 1) splitCitationSegments

用正規表達式 `/\[(\d+)\]/g` 把文字拆成段落：

```text
輸入: "根據研究[1]，鋼琴訓練[2]能提升認知"
輸出:
  { type: "text",     value: "根據研究" }
  { type: "citation", sourceIndex: 0, marker: "[1]", relationText: "根據研究" }
  { type: "text",     value: "，鋼琴訓練" }
  { type: "citation", sourceIndex: 1, marker: "[2]", relationText: "，鋼琴訓練" }
  { type: "text",     value: "能提升認知" }
```

### 2) getRelationText

擷取引用標記前面最近的一句話，用來在 popover 裡顯示「這段引用對應的回答文字」。

做法是往前找句號或問號，取最後一句，最多 90 字。

### 3) processAllChildren

因為回答經過 ReactMarkdown 會變成巢狀 DOM（`<p>`、`<li>`、`<strong>` 等），需要遞迴走訪所有子節點，把文字節點中的 `[n]` 替換成 Citation 元件。

這也是為什麼 MessageList 裡的 `components` prop 覆蓋了 `p`、`li`、`h1-h3`、`strong`、`em` 等元素。

## Citation 元件

```text
[1] <- 點擊
  |
  v
Popover 顯示:
  - 檔名 + 相似度百分比
  - "Referenced answer text"（回答中引用這段的文字）
  - "Source chunk"（來源 chunk 完整內容，可捲動）
```

Popover 使用 shadcn/ui 的 `Popover` 元件，固定寬度 `w-80`，朝上彈出。

## SourceCard 元件

用於來源列表預覽（非 popover 場景），顯示：

- 檔名 + 相似度百分比
- chunk 內容前 200 字 + 省略號

## 曾經修正的問題

### 引用重複顯示

早期做法是用 `replace()` 把 `[1]` 替換成 Citation 元件，但 Markdown 渲染後文字會被拆到不同 DOM 節點，導致同一個 `[1]` 被替換兩次。

解法：改用 `splitCitationSegments` 做一次性拆分，每個 `[n]` 只出現一次。

### Popover 截斷 chunk

早期 popover 硬截 200 字，看不到完整來源。

解法：改為 `max-h-52 overflow-y-auto`，chunk 完整顯示但限制高度，可捲動閱讀。
