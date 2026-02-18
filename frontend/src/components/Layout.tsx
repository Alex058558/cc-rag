import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-56 flex-col border-r bg-muted/40 p-4">
        <h1 className="mb-6 text-lg font-semibold">CC-RAG</h1>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
            }
          >
            Chat
          </NavLink>
          <NavLink
            to="/import"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
            }
          >
            Import
          </NavLink>
        </nav>
        <div className="border-t pt-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
