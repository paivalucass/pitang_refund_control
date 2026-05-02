import * as React from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { formatDate } from '@/lib/format'
import { createCategory, listCategories, updateCategory } from '@/services/categories.service'
import type { ApiError, Category } from '@/types'

export function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [name, setName] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setCategories(await listCategories())
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName('')
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setName(category.name)
    setDialogOpen(true)
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    if (editing) {
      await updateCategory(editing.id, { name })
    } else {
      await createCategory(name)
    }
    setDialogOpen(false)
    await load()
  }

  async function toggleActive(category: Category) {
    await updateCategory(category.id, { active: !category.active })
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
      {loading ? <LoadingTable /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <Card>
          <CardHeader><CardTitle>Lista de categorias</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
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
          </CardContent>
        </Card>
      ) : null}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="categoryName">Nome</Label>
          <Input id="categoryName" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Voltar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
