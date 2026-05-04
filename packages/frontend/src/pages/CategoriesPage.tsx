import * as React from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { PaginationControl } from '@/components/PaginationControl'
import { formatCurrency, formatDate } from '@/lib/format'
import { createCategoryWithLimit, listCategories, updateCategory, type CategoryListFilters } from '@/services/categories.service'
import type { ApiError, Category, PaginationMeta } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }

export function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [page, setPage] = React.useState(1)
  const [meta, setMeta] = React.useState<PaginationMeta>(initialMeta)
  const [filters, setFilters] = React.useState<CategoryListFilters>({})
  const [loading, setLoading] = React.useState(true)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [name, setName] = React.useState('')
  const [valueLimit, setValueLimit] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listCategories(page, PAGE_SIZE, filters)
      if (response.data.length === 0 && response.meta.total > 0 && page > response.meta.totalPages) {
        setPage(response.meta.totalPages)
        return
      }
      setCategories(response.data)
      setMeta(response.meta)
      setHasLoaded(true)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  React.useEffect(() => {
    void load()
  }, [load])

  function updateFilters(next: CategoryListFilters) {
    setPage(1)
    setFilters(next)
  }

  function clearFilters() {
    updateFilters({})
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setValueLimit('')
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setName(category.name)
    setValueLimit(category.valueLimit !== null && category.valueLimit !== undefined ? String(category.valueLimit) : '')
    setDialogOpen(true)
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    const parsedLimit = valueLimit.trim() ? Number(valueLimit) : null
    if (parsedLimit !== null && parsedLimit <= 0) return

    if (editing) {
      await updateCategory(editing.id, { name, valueLimit: parsedLimit })
      toast.success('Categoria atualizada com sucesso.')
    } else {
      await createCategoryWithLimit(name, parsedLimit)
      toast.success('Categoria criada com sucesso.')
    }
    setDialogOpen(false)
    if (page === 1) {
      await load()
    } else {
      setPage(1)
    }
  }

  async function toggleActive(category: Category) {
    await updateCategory(category.id, { active: !category.active })
    toast.success(category.active ? 'Categoria desativada com sucesso.' : 'Categoria ativada com sucesso.')
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-slate-500">Gerencie as categorias disponíveis para reembolso.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>
      {loading && !hasLoaded ? <LoadingTable /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {hasLoaded && !error ? (
        <Card>
          <CardHeader><CardTitle>Lista de categorias</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-4 md:grid-cols-[1fr_14rem_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="categorySearch">Busca</Label>
                <Input
                  id="categorySearch"
                  placeholder="Nome da categoria"
                  value={filters.search ?? ''}
                  onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryActive">Status</Label>
                <Select
                  id="categoryActive"
                  value={filters.active === '' || filters.active === undefined ? '' : String(filters.active)}
                  onChange={(event) => {
                    const value = event.target.value
                    updateFilters({ ...filters, active: value === '' ? '' : value === 'true' })
                  }}
                >
                  <option value="">Todas</option>
                  <option value="true">Ativas</option>
                  <option value="false">Inativas</option>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={clearFilters}>Limpar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow className={!category.active ? 'opacity-60' : undefined} key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {category.valueLimit !== null && category.valueLimit !== undefined ? formatCurrency(category.valueLimit) : 'Sem limite'}
                    </TableCell>
                    <TableCell>
                      <Badge className={category.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                        {category.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(category.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(category)}>Editar</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void toggleActive(category)}>
                          {category.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControl currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          </CardContent>
        </Card>
      ) : null}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nome</Label>
              <Input id="categoryName" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="categoryValueLimit">Limite de valor</Label>
              <Input
                id="categoryValueLimit"
                className="mt-2"
                min="0.01"
                placeholder="Sem limite"
                step="0.01"
                type="number"
                value={valueLimit}
                onChange={(event) => setValueLimit(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Voltar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
