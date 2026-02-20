# FastAPI 與 Uvicorn

## FastAPI 是什麼？

FastAPI 是一個 Python 的**網頁框架**，用來建立 API。

```
Request (前端) → FastAPI (後端) → Response
     ↑                ↑
   HTTP            Python 函數
```

### 為什麼這麼紅？

1. **超快** - 效能接近 Node.js 和 Go
2. **自動生成文件** - 寫完 API 直接有 Swagger UI 可以測試
3. **型別支援** - 完美搭配 Pydantic 和 TypeScript
4. **async/await** - 處理大量請求很高效

## Uvicorn 是什麼？

Uvicorn 是一個 **ASGI 伺服器**，專門用來運行 FastAPI 應用。

FastAPI 是框架，Uvicorn 是伺服器。兩者需要搭配使用。

```
┌─────────────────┐
│   FastAPI      │  ← 你的應用程式（Python 框架）
│   (app)        │
└────────┬────────┘
         │
         │ 誰來啟動它？
         ↓
┌─────────────────┐
│   Uvicorn       │  ← ASGI 伺服器
│                 │
└────────┬────────┘
         │
         ↓
    [監聽 HTTP 請求]
```

## 如何使用？

```bash
uvicorn backend.main:app --reload
```

- `backend.main:app` - [`backend/main.py`](../../backend/main.py) 裡的 `app` 物件
- `--reload` - 程式碼改變時自動重啟（開發用）

啟動後會看到：

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## 範例：定義一個 API

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/chat")
async def chat(message: str):
    return {"reply": f"You said: {message}"}
```

## Python 其他主流框架

| 框架 | 年齡 | 特色 |
|------|------|------|
| **FastAPI** | 2018 | 快、自動化文件、型別支援 |
| Flask | 2010 | 簡單、彈性大 |
| Django | 2005 | 全功能、All-in-one |

現在做 AI 專案、RAG、LLM 串接，幾乎都用 FastAPI！
