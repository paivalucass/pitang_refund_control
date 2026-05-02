import * as React from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { ReimbursementForm } from '@/components/ReimbursementForm'
import { useApi } from '@/hooks/useApi'
import { listCategories } from '@/services/categories.service'
import { createReimbursement, type ReimbursementFormData } from '@/services/reimbursements.service'
import type { ApiError } from '@/types'

export function NewReimbursementPage() {
  const navigate = useNavigate()
  const { data: categories, loading, error, refetch } = useApi(listCategories)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')

  async function handleSubmit(data: ReimbursementFormData) {
    setSaving(true)
    setSaveError('')
    try {
      await createReimbursement(data)
      navigate('/dashboard')
    } catch (err) {
      setSaveError((err as ApiError).message || 'Não foi possível criar a solicitação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova Solicitação</h1>
        <p className="text-sm text-slate-500">Registre uma despesa para reembolso.</p>
      </div>
      {loading ? <LoadingTable rows={3} /> : null}
      {error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}
      {categories ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados da despesa</CardTitle>
            <CardDescription>Todos os campos são obrigatórios.</CardDescription>
          </CardHeader>
          <CardContent>
            {saveError ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</p> : null}
            <ReimbursementForm categories={categories} submitLabel="Criar solicitação" loading={saving} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
