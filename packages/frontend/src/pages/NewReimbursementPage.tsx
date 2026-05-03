import * as React from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/sonner'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { ReimbursementForm } from '@/components/ReimbursementForm'
import { useApi } from '@/hooks/useApi'
import { listCategories } from '@/services/categories.service'
import { createReimbursement, type ReimbursementFormData } from '@/services/reimbursements.service'
import type { ApiError } from '@/types'

export function NewReimbursementPage() {
  const navigate = useNavigate()
  const loadCategories = React.useCallback(() => listCategories(1, 100), [])
  const { data: categoriesResponse, loading, error, refetch } = useApi(loadCategories)
  const categories = categoriesResponse?.data
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')

  async function handleSubmit(data: ReimbursementFormData) {
    setSaving(true)
    setSaveError('')
    try {
      await createReimbursement(data)
      toast.success('Solicitação criada com sucesso.')
      navigate('/dashboard')
    } catch (err) {
      setSaveError((err as ApiError).message || 'Não foi possível criar a solicitação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative min-h-48 overflow-hidden rounded-lg bg-red-700 p-6 text-white shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[15px] border-white/10" />
        <div className="absolute right-95 top-30 h-56 w-56 rounded-full border-[1px] border-white/10" />
        <img className="relative mb-6 h-14 w-auto invert brightness-0" src="/pitang_pitang.png" alt="Pitang" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">Nova Solicitação</h1>
          <p className="text-sm text-white/80">Registre uma despesa para reembolso.</p>
        </div>
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
