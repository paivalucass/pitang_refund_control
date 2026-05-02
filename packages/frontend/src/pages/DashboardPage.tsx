import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  approveReimbursement,
  cancelReimbursement,
  listReimbursements,
  payReimbursement,
  submitReimbursement,
} from '@/services/reimbursements.service'
import type { ApiError, Reimbursement } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = React.useState<Reimbursement[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [confirm, setConfirm] = React.useState<{ title: string; description: string; action: () => Promise<void> } | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await listReimbursements())
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar solicitações.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

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
            await load()
          })}
          {actionButton('Cancelar', async () => {
            await cancelReimbursement(request.id)
            await load()
          })}
        </>
      )
    }
    if (user.role === 'MANAGER' && request.status === 'SUBMITTED') {
      return actionButton('Aprovar', async () => {
        await approveReimbursement(request.id)
        await load()
      })
    }
    if (user.role === 'FINANCE' && request.status === 'APPROVED') {
      return actionButton('Marcar pago', async () => {
        await payReimbursement(request.id)
        await load()
      })
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Acompanhe as solicitações disponíveis para o seu perfil.</p>
        </div>
        {user?.role === 'EMPLOYEE' ? (
          <Button type="button" onClick={() => navigate('/reimbursements/new')}>
            <PlusCircle className="h-4 w-4" />
            Nova Solicitação
          </Button>
        ) : null}
      </div>
      {loading ? <LoadingTable /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? (
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
      ) : null}
      {items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
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
                    <TableCell>{request.category.name}</TableCell>
                    <TableCell>{formatCurrency(request.amount)}</TableCell>
                    <TableCell>{formatDate(request.expenseDate)}</TableCell>
                    <TableCell><StatusBadge status={request.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {buildActions(request)}
                        <Link
                          className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium underline-offset-4 hover:underline"
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
    </div>
  )
}
