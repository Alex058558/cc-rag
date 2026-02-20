# AsyncOpenAI + Gemini 串接

## 什麼是 AsyncOpenAI？

Python 的非同步版本 OpenAI 客戶端，讓你可以**同時處理多個請求**。

## 比喻

就像餐廳服務生：
- **同步**：一個一個接單、做事
- **非同步**：一次接多張單，同時煮不同的菜

## 為什麼要用非同步？

網路請求很慢，如果用同步寫法：
- 使用者發送訊息 → 等 API 回應（2秒）→ 才能處理下一個
- 非同步：可以在等回應的同時處理其他事情

## CC-RAG 的實作

```python
from openai import AsyncOpenAI

def get_llm_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
```

### 關鍵點

1. **base_url** - 指向 Google Gemini 的 OpenAI 兼容端點
2. **api_key** - 用 Supabase 的 GEMINI_API_KEY
3. 不需要額外安裝，OpenAI SDK 本身就支援

## 使用方式

```python
client = get_llm_client()

# 非同步呼叫
response = await client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[{"role": "user", "content": "你好"}],
)
```

## 在專案中的位置

[`backend/llm/client.py`](../../backend/llm/client.py) - LLM 客戶端統一管理

## 常見問題

### Q: 為什麼不直接用 Google 的 SDK？

因為 Gemini 有 OpenAI 兼容 API，這樣可以統一程式碼介面，未來想換模型也很方便。
