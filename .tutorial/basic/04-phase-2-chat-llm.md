# Phase 2 詳解：聊天介面與 LLM 串接

## 目標

一句話版本：Phase 2 要讓你看到「真的會動的聊天產品」，不是只有 API demo。

具體來說要達成「可以穩定聊天」：

- 使用者送出訊息
- 後端接住並呼叫 LLM
- 前端即時看到串流回覆
- 對話與訊息會持久化保存

## 功能清單（對應實作）

### 後端

- [`backend/llm/client.py`](../../backend/llm/client.py)：建立 Gemini OpenAI-compatible client
- [`backend/llm/schemas.py`](../../backend/llm/schemas.py)：聊天請求/回應 schema
- [`backend/routes/chat.py`](../../backend/routes/chat.py)：聊天 API（含 SSE）
- [`backend/services/chat.py`](../../backend/services/chat.py)：對話建立、訊息保存、歷史讀取

### 前端

- [`frontend/src/pages/ChatPage.tsx`](../../frontend/src/pages/ChatPage.tsx)：聊天主頁
- [`frontend/src/components/chat/MessageList.tsx`](../../frontend/src/components/chat/MessageList.tsx)：顯示訊息
- [`frontend/src/components/chat/MessageInput.tsx`](../../frontend/src/components/chat/MessageInput.tsx)：輸入與送出
- [`frontend/src/components/chat/ConversationSidebar.tsx`](../../frontend/src/components/chat/ConversationSidebar.tsx)：對話清單
- [`frontend/src/hooks/useChat.ts`](../../frontend/src/hooks/useChat.ts)：串流處理
- [`frontend/src/hooks/useConversations.ts`](../../frontend/src/hooks/useConversations.ts)：對話 CRUD

## 關鍵名詞

> 完整術語定義見 [RAG 名詞表](07-rag-glossary.md)，SSE 深度解說見 [rag/02-sse-streaming.md](../rag/02-sse-streaming.md)

- **SSE**：伺服器持續推送資料給前端，適合 LLM token 串流。
- **Token Streaming**：邊生成邊回傳，不等全部完成，體感更即時。
- **Stateless API**：後端不保存 session，該帶的 context 要自己帶齊。

## 實際流程

```text
使用者送出問題
-> 前端呼叫 /api/chat
-> 後端取得 conversation 與歷史訊息
-> 呼叫 LLM 並串流 token
-> 前端逐步更新 assistant 訊息
-> 串流結束後儲存完整回覆
```

這樣做的好處是「體感很快」。即使模型要 5 秒講完，使用者也會在第 1 秒看到內容開始出現。

## 為什麼要拆 Hook

- `useChat`：管聊天狀態
- `useConversations`：管會話列表

分開後可讀性和可維護性都更高，避免單一元件過胖。

你可以把它想成：

- `useChat` 是聊天引擎
- `useConversations` 是對話清單管理員

兩個職責切開，改一邊比較不會炸另一邊。

## 常見錯誤

### 1) 串流斷掉

先檢查 `res.body` 是否存在、網路中斷、或後端例外未捕捉。

### 2) 訊息順序亂掉

通常是前端更新 state 沒用函數式更新，或並發寫入衝突。

這種 bug 通常很陰。看起來偶發，但其實是更新時機競爭造成的。

### 3) 對話標題沒更新

檢查是否只在第一輪對話觸發標題生成邏輯。

## 完成判定

Phase 2 完成時，至少要滿足：

- 新對話可建立
- 串流正常顯示
- 歷史訊息刷新後仍存在
- 切換不同 conversation 能正確載入內容
