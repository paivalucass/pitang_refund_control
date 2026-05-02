import * as React from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import {
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ReceiptText,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/components/RoleBadge'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Nova Solicitação', to: '/reimbursements/new', icon: PlusCircle, roles: ['EMPLOYEE'] },
  { label: 'Histórico', to: '/reimbursements/history', icon: History, roles: ['MANAGER', 'FINANCE'] },
  { label: 'Categorias', to: '/categories', icon: FolderOpen, roles: ['ADMIN'] },
  { label: 'Usuários', to: '/users', icon: Users, roles: ['ADMIN'] },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role))

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r bg-white">
      <Link className="flex h-16 items-center gap-2 px-6 font-semibold" to="/dashboard">
        <ReceiptText className="h-5 w-5" />
        Pitang Reembolsos
      </Link>
      <Separator />
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100',
                  isActive && 'bg-slate-100 text-slate-950',
                )
              }
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden fixed inset-y-0 left-0 lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? <RoleBadge role={user.role} /> : null}
            <Button type="button" variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
