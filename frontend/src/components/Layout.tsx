import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Outlet, NavLink } from 'react-router-dom'
import { MessageSquare, FileUp, LogOut } from 'lucide-react'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-14 flex-col items-center border-r bg-muted/40 py-4 gap-2">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`
          }
          title="Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </NavLink>
        <NavLink
          to="/import"
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`
          }
          title="Import"
        >
          <FileUp className="h-5 w-5" />
        </NavLink>
        <div className="flex-1" />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground truncate w-12" title={user?.email ?? ''}>
            {user?.email?.split('@')[0]}
          </p>
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1" onClick={signOut} title="Sign Out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
