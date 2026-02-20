# Chat Service 服務層

## 什麼是 Service 層？

在 FastAPI 中：
- **Routes** - 負責處理 HTTP 請求/回應
- **Service** - 負責商業邏輯

```
請求 → Routes → Service → Database
                ↓
            LLM API
```

## 比喻

就像餐廳：
- **Routes**：服務生接收點餐
- **Service**：廚師做菜
- **Database**：冰箱（存放食材）

## CC-RAG 的 Chat Service

[`backend/services/chat.py`](../../backend/services/chat.py) 負責：

### 1. 對話管理

```python
async def get_or_create_conversation(db, user_id, conversation_id):
    # 有 ID → 取得現有對話
    # 沒有 ID → 建立新對話
```

### 2. 訊息儲存

```python
async def save_message(db, conversation_id, user_id, role, content):
    # role: "user" 或 "assistant"
    # 存進 Supabase messages 表
```

### 3. 取得歷史

```python
async def get_conversation_messages(db, conversation_id, user_id):
    # 取出這個對話的所有訊息
    # 依時間排序
```

### 4. LLM 串流回應

```python
async def stream_chat_response(llm, db, conversation_id, user_id, user_message):
    # 把歷史傳給 LLM
    # 一邊生成一邊 yield（串流輸出）
    # 最後存進資料庫
```

### 5. 自動生成標題

```python
async def update_conversation_title(llm, db, conversation_id, first_message):
    # 叫 LLM 根據第一句話產生標題
    # 例如：「如何設定環境變數」→「環境設定問題」
```

## 為什麼要分 Service？

1. **職責分離** - Routes 只管 HTTP，邏輯歸 Service
2. **好測試** - Service 可以單獨測試
3. **好維護** - 未來改邏輯只改一處

## 在專案中的位置

| 檔案 | 職責 |
|------|------|
| [`backend/routes/chat.py`](../../backend/routes/chat.py) | HTTP API |
| [`backend/services/chat.py`](../../backend/services/chat.py) | 商業邏輯 |
| [`backend/llm/client.py`](../../backend/llm/client.py) | LLM API 串接 |
