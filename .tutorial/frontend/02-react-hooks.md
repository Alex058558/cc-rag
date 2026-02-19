# React Hooks：useChat

## 什麼是 Hook？

**Hook** = 把「狀態管理邏輯」抽出來變成可重複使用的函數。

## 比喻

就像**食譜**：
- 每次做菜不用從頭想配方
- 把「怎麼炒蛋」寫成食譜，下次直接用

React Hook 就是把「怎麼管理狀態」寫成函數。

## useChat Hook

`frontend/src/hooks/useChat.ts` - 管理聊天狀態的鉤子。

### 提供什麼？

```typescript
const {
  messages,      // 訊息列表
  streaming,     // 是否正在生成中
  loadingHistory, // 是否在載入歷史
  loadMessages,  // 載入歷史訊息
  send,          // 發送訊息
  stop,          // 停止生成
  clear,         // 清除訊息
} = useChat()
```

### 內部邏輯

1. **發送訊息** (`send`)
   - 先顯示使用者的訊息
   - 建立空的 AI 訊息框
   - 發送 POST 請求到 `/api/chat`
   - 用 `reader.read()` 讀取 SSE 串流
   - 一邊讀一邊把字加到 AI 訊息

2. **串流處理**
   ```typescript
   while (true) {
     const { done, value } = await reader.read()
     if (done) break

     const text = decoder.decode(value)
     // 解析 "data: {token: "x"}" 格式
     // setMessages(prev => prev + token)
   }
   ```

3. **取消功能**
   ```typescript
   const controller = new AbortController()
   fetch(url, { signal: controller.signal })

   // 使用者按停止
   controller.abort()
   ```

## 為什麼要包成 Hook？

**不用重複寫**：
- 每個需要聊天功能的頁面
- 只需要呼叫 `useChat()` 就行
- 不用copy-paste 一樣的程式碼

## 相關檔案

| 檔案 | 用途 |
|------|------|
| `hooks/useChat.ts` | 聊天狀態管理 |
| `hooks/useConversations.ts` | 對話列表管理 |
| `lib/api.ts` | API fetch 工具 |

## api.ts 做了什麼？

```typescript
export async function apiFetch(path, options, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // 自動帶 JWT
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers })
}
```

統一處理：
- JWT token 自動帶入
- 錯誤處理
- API 路徑前缀
