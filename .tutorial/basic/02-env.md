# 環境變數管理

## 什麼是環境變數？

環境變數是**設定檔**的一種，用來存放：
- API 金鑰
- 資料庫連線
- 敏感資訊

## 為什麼不用寫在程式碼？

```python
# ❌ 不好 - 金鑰寫在程式碼裡
API_KEY = "sk-1234567890abcdef"

# ✅ 好 - 從環境變數讀
API_KEY = os.getenv("API_KEY")
```

這樣：
1. 不會把機密上傳到 Git
2. 不同環境可以用不同設定（開發、生產）

## Pydantic Settings

Python 的**環境變數管理庫**，優雅又方便。

### config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    gemini_model: str = "gemini-2.0-flash"
    embedding_model: str = "text-embedding-004"

    model_config = {"env_file": ".env"}
```

### 優先順序

```
.env 裡的值 > config.py 裡的預設值
```

```python
# config.py
gemini_model: str = "gemini-2.0-flash"  # 預設值

# .env
GEMINI_MODEL=gemini-2.5-flash  # 這個會覆蓋預設值
```

## .gitignore

`.env` 必須加入 `.gitignore`，避免上傳！

```
.env
.env.*
```

## 你的專案環境變數

### 後端 `.env`

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 前端 `.env.local`

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

注意：前端環境變數必須開頭是 `VITE_`，這樣 Vite 才會讀取。

## 常見問題

### Q: 可以把資料庫密碼寫在 .env 嗎？

可以！`.env` 不會被 commit。但建議用密碼管理工具更安全。

### Q: .env 一定要加 .gitignore 嗎？

一定要！除非你想把機密上傳到 Git 公開給大家看 xd
