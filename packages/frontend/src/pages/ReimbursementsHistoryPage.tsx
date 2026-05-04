import * as React from 'react'
import { Link } from 'react-router'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { PaginationControl } from '@/components/PaginationControl'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/format'
import { listCategories } from '@/services/categories.service'
import { listPastReimbursements, type ReimbursementListFilters } from '@/services/reimbursements.service'
import type { ApiError, Category, PaginationMeta, Reimbursement, RequestStatus } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }
const historyStatuses: Array<{ value: RequestStatus; label: string }> = [
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'PAID', label: 'Paga' },
]

export function ReimbursementsHistoryPage() {
  const { user } = useAuth()
  const [items, setItems] = React.useState<Reimbursement[]>([])
  const [page, setPage] = React.useState(1)
  const [meta, setMeta] = React.useState<PaginationMeta>(initialMeta)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [filters, setFilters] = React.useState<ReimbursementListFilters>({ sortBy: 'createdAt', sortOrder: 'desc' })
  const [loading, setLoading] = React.useState(true)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState('')
  const description =
    user?.role === 'FINANCE'
      ? 'Solicitações pagas'
      : 'Solicitações aprovadas, rejeitadas ou pagas'

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listPastReimbursements(page, PAGE_SIZE, filters)
      if (response.data.length === 0 && response.meta.total > 0 && page > response.meta.totalPages) {
        setPage(response.meta.totalPages)
        return
      }
      setItems(response.data)
      setMeta(response.meta)
      setHasLoaded(true)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar o histórico.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

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

  function updateFilters(next: ReimbursementListFilters) {
    setPage(1)
    setFilters(next)
  }

  function clearFilters() {
    updateFilters({ sortBy: 'createdAt', sortOrder: 'desc' })
  }

  return (
    <div className="space-y-6">
      <div className="relative min-h-48 overflow-hidden rounded-lg bg-red-700 p-6 text-white shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[15px] border-white/10" />
        <div className="absolute right-95 top-30 h-56 w-56 rounded-full border-[1px] border-white/10" />
        <img className="relative mb-6 h-14 w-auto invert brightness-0" src="/pitang_pitang.png" alt="Pitang" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">Histórico</h1>
          <p className="text-sm text-white/80">{description}.</p>
        </div>
      </div>

      {loading && !hasLoaded ? <LoadingTable /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {hasLoaded && !error ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="historySearch">Busca</Label>
                <Input
                  id="historySearch"
                  placeholder="Descrição ou colaborador"
                  value={filters.search ?? ''}
                  onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historyCategory">Categoria</Label>
                <Select
                  id="historyCategory"
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
                <Label htmlFor="historyStatus">Status</Label>
                <Select
                  id="historyStatus"
                  value={filters.status ?? ''}
                  onChange={(event) => updateFilters({ ...filters, status: event.target.value as RequestStatus | '' })}
                >
                  <option value="">Todos</option>
                  {historyStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="historySort">Ordenação</Label>
                <Select
                  id="historySort"
                  value={`${filters.sortBy ?? 'createdAt'}:${filters.sortOrder ?? 'desc'}`}
                  onChange={(event) => {
                    const [sortBy, sortOrder] = event.target.value.split(':') as [ReimbursementListFilters['sortBy'], ReimbursementListFilters['sortOrder']]
                    updateFilters({ ...filters, sortBy, sortOrder })
                  }}
                >
                  <option value="createdAt:desc">Mais recentes</option>
                  <option value="createdAt:asc">Mais antigas</option>
                  <option value="expenseDate:desc">Despesa mais recente</option>
                  <option value="expenseDate:asc">Despesa mais antiga</option>
                  <option value="amount:desc">Maior valor</option>
                  <option value="amount:asc">Menor valor</option>
                </Select>
              </div>
            </div>
            <div className="mb-4 flex justify-end">
              <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            </div>
            {items.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="Nenhuma solicitação no histórico"
                description={`${description} aparecerão aqui.`}
              />
            ) : (
              <>
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[32%]">Descrição</TableHead>
                      <TableHead className="w-[17%]">Solicitante</TableHead>
                      <TableHead className="w-[15%]">Categoria</TableHead>
                      <TableHead className="w-[10%]">Valor</TableHead>
                      <TableHead className="w-[11%]">Data</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          <span className="block truncate" title={request.description}>{request.description}</span>
                        </TableCell>
                        <TableCell>{request.requester.name}</TableCell>
                        <TableCell>{request.category.name}</TableCell>
                        <TableCell>{formatCurrency(request.amount)}</TableCell>
                        <TableCell>{formatDate(request.expenseDate)}</TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell>
                          <Link
                            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium hover:bg-slate-100"
                            to={`/reimbursements/${request.id}`}
                          >
                            Detalhe
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControl currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
