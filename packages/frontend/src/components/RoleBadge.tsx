import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const labels: Record<UserRole, string> = {
  EMPLOYEE: 'Colaborador',
  MANAGER: 'Gestor',
  FINANCE: 'Financeiro',
  ADMIN: 'Admin',
}

const colors: Record<UserRole, string> = {
  EMPLOYEE: 'bg-slate-100 text-slate-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  FINANCE: 'bg-teal-100 text-teal-700',
  ADMIN: 'bg-violet-100 text-violet-700',
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return <Badge className={cn('rounded-md border-transparent', colors[role], className)}>{labels[role]}</Badge>
}

export { labels as roleLabels }
