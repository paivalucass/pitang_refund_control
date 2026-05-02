import * as React from 'react'
import { Link } from 'react-router'
import { Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/format'
import { listPastReimbursements } from '@/services/reimbursements.service'
import type { ApiError, Reimbursement } from '@/types'

export function ReimbursementsHistoryPage() {
  const { user } = useAuth()
  const [items, setItems] = React.useState<Reimbursement[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const description =
    user?.role === 'FINANCE'
      ? 'Solicitações pagas'
      : 'Solicitações aprovadas, rejeitadas ou pagas'

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await listPastReimbursements())
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar o histórico.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

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

      {loading ? <LoadingTable /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Nenhuma solicitação no histórico"
          description={`${description} aparecerão aqui.`}
        />
      ) : null}

      {items.length > 0 ? (
        <Card className="min-h-[28rem]">
          <CardHeader>
            <CardTitle>Histórico de solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.description}</TableCell>
                    <TableCell>{request.requester.name}</TableCell>
                    <TableCell>{request.category.name}</TableCell>
                    <TableCell>{formatCurrency(request.amount)}</TableCell>
                    <TableCell>{formatDate(request.expenseDate)}</TableCell>
                    <TableCell><StatusBadge status={request.status} /></TableCell>
                    <TableCell>
                      <Link
                        className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium underline-offset-4 hover:underline"
                        to={`/reimbursements/${request.id}`}
                      >
                        Detalhe
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
