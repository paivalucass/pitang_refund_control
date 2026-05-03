import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { PaginationControl } from '@/components/PaginationControl'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/format'
import { listCategories } from '@/services/categories.service'
import {
  approveReimbursement,
  cancelReimbursement,
  listReimbursements,
  payReimbursement,
  rejectReimbursement,
  submitReimbursement,
  type ReimbursementListFilters,
} from '@/services/reimbursements.service'
import type { ApiError, Category, PaginationMeta, Reimbursement, RequestStatus } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }
const requestStatuses: Array<{ value: RequestStatus; label: string }> = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'PAID', label: 'Paga' },
  { value: 'CANCELED', label: 'Cancelada' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const showRequester = user?.role === 'MANAGER' || user?.role === 'FINANCE' || user?.role === 'ADMIN'
  const [items, setItems] = React.useState<Reimbursement[]>([])
  const [page, setPage] = React.useState(1)
  const [meta, setMeta] = React.useState<PaginationMeta>(initialMeta)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [filters, setFilters] = React.useState<ReimbursementListFilters>({ sortBy: 'createdAt', sortOrder: 'desc' })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [confirm, setConfirm] = React.useState<{ title: string; description: string; action: () => Promise<void> } | null>(null)
  const [rejectTarget, setRejectTarget] = React.useState<Reimbursement | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listReimbursements(page, PAGE_SIZE, filters)
      if (response.data.length === 0 && response.meta.total > 0 && page > response.meta.totalPages) {
        setPage(response.meta.totalPages)
        return
      }
      setItems(response.data)
      setMeta(response.meta)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar solicitações.')
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

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectTarget || !rejectionReason.trim()) return

    await rejectReimbursement(rejectTarget.id, rejectionReason)
    toast.success('Solicitação rejeitada com sucesso.')
    setRejectTarget(null)
    setRejectionReason('')
    await load()
  }

  function buildActions(request: Reimbursement) {
    if (!user) return null
    const actionButton = (label: string, action: () => Promise<void>) => (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(event) => {
          event.stopPropagation()
          setConfirm({ title: label, description: `Confirma a ação para "${request.description}"?`, action })
        }}
      >
        {label}
      </Button>
    )

    if (user.role === 'EMPLOYEE' && request.status === 'DRAFT') {
      return (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/reimbursements/${request.id}/edit`)
            }}
          >
            Editar
          </Button>
          {actionButton('Enviar', async () => {
            await submitReimbursement(request.id)
            toast.success('Solicitação enviada para análise.')
            await load()
          })}
          {actionButton('Cancelar', async () => {
            await cancelReimbursement(request.id)
            toast.success('Solicitação cancelada com sucesso.')
            await load()
          })}
        </>
      )
    }
    if (user.role === 'MANAGER' && request.status === 'SUBMITTED') {
      return (
        <>
          {actionButton('Aprovar', async () => {
            await approveReimbursement(request.id)
            toast.success('Solicitação aprovada com sucesso.')
            await load()
          })}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={(event) => {
              event.stopPropagation()
              setRejectTarget(request)
              setRejectionReason('')
            }}
          >
            Rejeitar
          </Button>
        </>
      )
    }
    if (user.role === 'FINANCE' && request.status === 'APPROVED') {
      return actionButton('Marcar pago', async () => {
        await payReimbursement(request.id)
        toast.success('Solicitação marcada como paga.')
        await load()
      })
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="relative min-h-48 overflow-hidden rounded-lg bg-red-700 p-6 text-white shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[15px] border-white/10" />
        <div className="absolute right-95 top-30 h-56 w-56 rounded-full border-[1px] border-white/10" />
        <img className="relative mb-6 h-14 w-auto invert brightness-0" src="/pitang_pitang.png" alt="Pitang" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-white/80">Acompanhe as solicitações disponíveis para o seu perfil.</p>
          </div>
          {user?.role === 'EMPLOYEE' ? (
            <Button className="bg-white text-red-700 hover:bg-white/90" type="button" onClick={() => navigate('/reimbursements/new')}>
              <PlusCircle className="h-4 w-4" />
              Nova Solicitação
            </Button>
          ) : null}
        </div>
      </div>
      {loading ? <LoadingTable /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="requestSearch">Busca</Label>
                <Input
                  id="requestSearch"
                  placeholder="Descrição ou colaborador"
                  value={filters.search ?? ''}
                  onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestCategory">Categoria</Label>
                <Select
                  id="requestCategory"
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
                <Label htmlFor="requestStatus">Status</Label>
                <Select
                  id="requestStatus"
                  value={filters.status ?? ''}
                  onChange={(event) => updateFilters({ ...filters, status: event.target.value as RequestStatus | '' })}
                >
                  <option value="">Todos</option>
                  {requestStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestSort">Ordenação</Label>
                <Select
                  id="requestSort"
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
                title="Nenhuma solicitação encontrada"
                description="Quando houver solicitações para o seu perfil, elas aparecerão aqui."
                action={
                  user?.role === 'EMPLOYEE' ? (
                    <Button type="button" onClick={() => navigate('/reimbursements/new')}>
                      Criar solicitação
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      {showRequester ? <TableHead>Solicitante</TableHead> : null}
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((request) => (
                      <TableRow className="cursor-pointer" key={request.id} onClick={() => navigate(`/reimbursements/${request.id}`)}>
                        <TableCell className="font-medium">{request.description}</TableCell>
                        {showRequester ? <TableCell>{request.requester.name}</TableCell> : null}
                        <TableCell>{request.category.name}</TableCell>
                        <TableCell>{formatCurrency(request.amount)}</TableCell>
                        <TableCell>{formatDate(request.expenseDate)}</TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {buildActions(request)}
                            <Link
                              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-100"
                              to={`/reimbursements/${request.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              Detalhe
                            </Link>
                          </div>
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
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        onConfirm={async () => {
          await confirm?.action()
        }}
      />
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectionReason('')
          }
        }}
        title="Rejeitar solicitação"
      >
        <form onSubmit={handleReject}>
          <Label htmlFor="dashboardRejectionReason">Justificativa</Label>
          <Textarea
            id="dashboardRejectionReason"
            className="mt-2"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>Voltar</Button>
            <Button type="submit" variant="destructive">Rejeitar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
