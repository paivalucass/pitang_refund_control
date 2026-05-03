import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { PaginationControl } from '@/components/PaginationControl'
import { RoleBadge } from '@/components/RoleBadge'
import { formatDate } from '@/lib/format'
import { listUsers } from '@/services/users.service'
import type { ApiError, PaginationMeta, User } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }

export function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [page, setPage] = React.useState(1)
  const [meta, setMeta] = React.useState<PaginationMeta>(initialMeta)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listUsers(page, PAGE_SIZE)
      if (response.data.length === 0 && response.meta.total > 0 && page > response.meta.totalPages) {
        setPage(response.meta.totalPages)
        return
      }
      setUsers(response.data)
      setMeta(response.meta)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [page])

  React.useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-slate-500">Consulta dos usuários cadastrados.</p>
      </div>
      {loading ? <LoadingTable /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <Card>
          <CardHeader><CardTitle>Lista de usuários</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControl currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
