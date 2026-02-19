# 前端技術棧

## Vite

**前端建置工具**，幫你把 TypeScript/React 程式碼編譯成瀏覽器看得懂的東西。

```bash
# 啟動開發伺服器
npm run dev

# 打包上線
npm run build
```

- **熱更新** - 改 code 不用重整頁面
- **快速** - 用 ESBuild，編譯超快

## React

**前端 UI 框架**，用「元件」來构建页面。

```jsx
function LoginPage() {
  return <div>
    <h1>登入</h1>
    <Input placeholder="帳號" />
  </div>
}
```

### Hooks

React 的函式，讓元件有「狀態」：

```jsx
const [count, setCount] = useState(0)
// count = 狀態
// setCount = 更新狀態的函數
```

## TypeScript

JavaScript 的**強化版**，多了型別檢查。

```typescript
// JavaScript - 隨便給
const name = "Alexis"

// TypeScript - 限定類型
const name: string = "Alexis"
const age: number = 25
const isLogin: boolean = true
```

好處：寫錯會**馬上被發現**，不用等到執行！

## Tailwind CSS

** utility-first 的 CSS 框架**，不用寫 CSS 檔案。

```html
<!-- 傳統 CSS -->
<style>.btn { background: blue; color: white; }</style>
<button class="btn">按鈕</button>

<!-- Tailwind -->
<button class="bg-blue-500 text-white px-4 py-2">按鈕</button>
```

常見 class：
- `bg-blue-500` - 背景藍色
- `text-white` - 文字白色
- `px-4 py-2` - 內距
- `rounded` - 圓角

## shadcn/ui

一套**美觀的 React 元件庫**，內建 Tailwind 樣式。

```bash
# 安裝元件
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

可用元件：Button, Input, Card, Dialog, Dropdown...

## AuthContext

React 的**認證狀態管理**，讓整個 App 都知道用戶登入狀態。

```typescript
// App.tsx
<AuthProvider>
  <App />
</AuthContext>

// 任何地方都能用
const { user, signIn, signOut } = useAuth()
```

## ProtectedRoute

**保護路由**，没登入就跳轉。

```jsx
function ProtectedRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}
```

## 專案結構

```
frontend/
├── src/
│   ├── main.tsx          # 入口
│   ├── App.tsx           # 主元件 + Router
│   ├── lib/
│   │   └── supabase.ts   # Supabase 客戶端
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── ImportPage.tsx
│   └── components/
│       ├── Layout.tsx
│       └── ui/           # shadcn 元件
└── .env.local            # 環境變數
```
