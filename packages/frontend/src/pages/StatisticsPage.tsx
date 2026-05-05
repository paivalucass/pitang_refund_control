import * as React from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ErrorState } from '@/components/ErrorState'
import { ReimbursementStats } from '@/components/ReimbursementStats'
import { useAuth } from '@/contexts/AuthContext'
import { listCategories } from '@/services/categories.service'
import {
  listPastReimbursements,
  listReimbursements,
} from '@/services/reimbursements.service'
import type { ApiError, Category, Reimbursement, RequestStatus } from '@/types'

const requestStatuses: Array<{ value: RequestStatus; label: string }> = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'PAID', label: 'Paga' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const historyStatuses: Array<{ value: RequestStatus; label: string }> = [
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'PAID', label: 'Paga' },
]

export function StatisticsPage() {
  const { user } = useAuth()
  const [items, setItems] = React.useState<Reimbursement[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [filters, setFilters] = React.useState<{ categoryId?: string; status?: RequestStatus | '' }>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const usesHistoryData = user?.role === 'MANAGER' || user?.role === 'FINANCE'
  const statuses = usesHistoryData ? historyStatuses : requestStatuses

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = usesHistoryData
        ? await listPastReimbursements(1, 100, filters)
        : await listReimbursements(1, 100, filters)
      setItems(response.data)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar as estatísticas.')
    } finally {
      setLoading(false)
    }
  }, [filters, usesHistoryData])

  React.useEffect(() => {
    void load()
  }, [load])

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const response = await listCategories(1, 100)
        setCategories(response.data)
      } catch {
        setCategories([])
      }
    }
    void loadCategories()
  }, [])

  function updateFilters(next: { categoryId?: string; status?: RequestStatus | '' }) {
    setFilters(next)
  }

  function clearFilters() {
    updateFilters({})
  }

  return (
    <div className="space-y-6">
      <div className="relative min-h-48 overflow-hidden rounded-lg bg-red-700 p-6 text-white shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[15px] border-white/10" />
        <div className="absolute right-95 top-30 h-56 w-56 rounded-full border-[1px] border-white/10" />
        <img className="relative mb-6 h-14 w-auto invert brightness-0" src="/pitang_pitang.png" alt="Pitang" />
        <div className="relative flex items-end gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Estatísticas</h1>
            <p className="text-sm text-white/80">
              Analise valores, categorias e status das solicitações.
            </p>
          </div>
        </div>
      </div>

      {error && !loading ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error ? (
        <ReimbursementStats
          title={usesHistoryData ? 'Resumo financeiro do histórico' : 'Resumo das solicitações'}
          items={items}
          loading={loading}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="statisticsCategory">Categoria</Label>
              <Select
                id="statisticsCategory"
                value={filters.categoryId ?? ''}
                onChange={(event) => updateFilters({ ...filters, categoryId: event.target.value })}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statisticsStatus">Status</Label>
              <Select
                id="statisticsStatus"
                value={filters.status ?? ''}
                onChange={(event) => updateFilters({ ...filters, status: event.target.value as RequestStatus | '' })}
              >
                <option value="">Todos</option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        </ReimbursementStats>
      ) : null}
    </div>
  )
}
