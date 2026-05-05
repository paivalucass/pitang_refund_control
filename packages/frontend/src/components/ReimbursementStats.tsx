import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import type { Reimbursement, RequestStatus } from '@/types'

const statusLabels: Record<RequestStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviadas',
  APPROVED: 'Aprovadas',
  REJECTED: 'Rejeitadas',
  PAID: 'Pagas',
  CANCELED: 'Canceladas',
}

type SummaryGroup = {
  name: string
  amount: number
  count: number
}

type ReimbursementStatsProps = {
  title: string
  items: Reimbursement[]
  loading?: boolean
  children?: ReactNode
}

export function ReimbursementStats({ title, items, loading = false, children }: ReimbursementStatsProps) {
  const total = sumAmounts(items)
  const average = items.length > 0 ? total / items.length : 0
  const byCategory = groupBy(items, (item) => item.category.name)
  const byStatus = groupBy(items, (item) => statusLabels[item.status])
  const topCategory = byCategory[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        {loading ? (
          <p className="text-sm text-slate-500">Carregando indicadores...</p>
        ) : null}
        {!loading ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Total geral" value={formatCurrency(total)} />
              <StatTile label="Solicitações" value={String(items.length)} />
              <StatTile label="Ticket médio" value={formatCurrency(average)} />
              <StatTile label="Maior categoria" value={topCategory ? `${topCategory.name} (${formatCurrency(topCategory.amount)})` : 'Sem dados'} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <SummaryList title="Valor por categoria" groups={byCategory} />
              <SummaryList title="Valor por status" groups={byStatus} />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-900" title={value}>{value}</p>
    </div>
  )
}

function SummaryList({ title, groups }: { title: string; groups: SummaryGroup[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {groups.length === 0 ? <p className="mt-2 text-sm text-slate-500">Sem dados para exibir.</p> : null}
      {groups.length > 0 ? (
        <div className="mt-2 space-y-2">
          {groups.slice(0, 6).map((group) => (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm" key={group.name}>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700" title={group.name}>{group.name}</p>
                <p className="text-xs text-slate-500">{group.count} solicitação{group.count === 1 ? '' : 'ões'}</p>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(group.amount)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function sumAmounts(items: Reimbursement[]) {
  return items.reduce((total, item) => total + Number(item.amount), 0)
}

function groupBy(items: Reimbursement[], getName: (item: Reimbursement) => string) {
  const groups = new Map<string, SummaryGroup>()
  for (const item of items) {
    const name = getName(item)
    const current = groups.get(name) ?? { name, amount: 0, count: 0 }
    current.amount += Number(item.amount)
    current.count += 1
    groups.set(name, current)
  }
  return [...groups.values()].sort((left, right) => right.amount - left.amount)
}
