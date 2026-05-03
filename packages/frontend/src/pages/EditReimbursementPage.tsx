import * as React from 'react'
import { useNavigate, useParams } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/sonner'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { ReimbursementForm } from '@/components/ReimbursementForm'
import { useAuth } from '@/contexts/AuthContext'
import { listCategories } from '@/services/categories.service'
import {
  getReimbursement,
  updateReimbursement,
  type ReimbursementFormData,
} from '@/services/reimbursements.service'
import type { ApiError, Category, Reimbursement } from '@/types'

export function EditReimbursementPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [reimbursement, setReimbursement] = React.useState<Reimbursement | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function load() {
      try {
        const [request, categoryList] = await Promise.all([getReimbursement(id), listCategories(1, 100)])
        setReimbursement(request)
        setCategories(categoryList.data)
      } catch (err) {
        setError((err as ApiError).message || 'Não foi possível carregar a solicitação.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  async function handleSubmit(data: ReimbursementFormData) {
    setSaving(true)
    setError('')
    try {
      const updated = await updateReimbursement(id, data)
      toast.success('Solicitação atualizada com sucesso.')
      navigate(`/reimbursements/${updated.id}`)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const canEdit = reimbursement?.status === 'DRAFT' && reimbursement.requesterId === user?.id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar Solicitação</h1>
        <p className="text-sm text-slate-500">Apenas rascunhos do próprio colaborador podem ser editados.</p>
      </div>
      {loading ? <LoadingTable rows={3} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {reimbursement && !canEdit ? <ErrorState message="Esta solicitação não pode ser editada." /> : null}
      {reimbursement && canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados da despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <ReimbursementForm
              categories={categories}
              initialValues={{
                categoryId: reimbursement.categoryId,
                description: reimbursement.description,
                amount: Number(reimbursement.amount),
                expenseDate: reimbursement.expenseDate.slice(0, 10),
              }}
              submitLabel="Salvar alterações"
              loading={saving}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
