import * as React from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { FolderOpen, History, LayoutDashboard, LogOut, Menu, PlusCircle, Users, X } from 'lucide-react'
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
    <aside className="flex h-full w-72 flex-col border-r border-red-950/20 bg-red-700 text-white">
      <Link className="flex h-22 flex-col items-start justify-center gap-2 px-6" to="/dashboard">
        <img className="h-11 w-auto" src="/logo-pitang.png" alt="Pitang" />
      </Link>
      <Separator className="bg-white/20" />
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white',
                  isActive && '!bg-white !text-red-700 hover:!bg-white hover:!text-red-700 [&_svg]:!text-red-700',
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
    <div className="min-h-screen bg-red-50">
      <div className="hidden fixed inset-y-0 left-0 lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-red-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-red-100 bg-white px-4 shadow-sm lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-700 lg:hidden" onClick={() => setMobileOpen(true)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Abrir menu</span>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-red-950">{user?.name}</p>
              <p className="truncate text-xs text-red-700/70">{user?.email}</p>
            </div>
          </div>
          <div className="min-w-0 justify-self-center text-center">
            <p className="truncate text-2xl font-bold text-red-700">Controle de Reembolsos</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? <RoleBadge className="bg-slate-100 px-3 py-1 text-slate-700" role={user.role} /> : null}
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
