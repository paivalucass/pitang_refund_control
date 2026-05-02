import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { firstZodError, reimbursementSchema } from '@/lib/validation'
import type { Category } from '@/types'
import type { ReimbursementFormData } from '@/services/reimbursements.service'

type ReimbursementFormProps = {
  categories: Category[]
  initialValues?: Partial<ReimbursementFormData>
  submitLabel: string
  loading?: boolean
  onSubmit: (data: ReimbursementFormData) => void
}

export function ReimbursementForm({
  categories,
  initialValues,
  submitLabel,
  loading = false,
  onSubmit,
}: ReimbursementFormProps) {
  const [categoryId, setCategoryId] = React.useState(initialValues?.categoryId ?? '')
  const [description, setDescription] = React.useState(initialValues?.description ?? '')
  const [amount, setAmount] = React.useState(initialValues?.amount?.toString() ?? '')
  const [expenseDate, setExpenseDate] = React.useState(initialValues?.expenseDate ?? '')
  const [error, setError] = React.useState('')
  const activeCategories = categories.filter((category) => category.active)

  React.useEffect(() => {
    setCategoryId(initialValues?.categoryId ?? '')
    setDescription(initialValues?.description ?? '')
    setAmount(initialValues?.amount?.toString() ?? '')
    setExpenseDate(initialValues?.expenseDate ?? '')
  }, [initialValues])

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const result = reimbursementSchema.safeParse({ categoryId, description, amount, expenseDate })
    if (!result.success) {
      setError(firstZodError(result.error))
      return
    }

    onSubmit(result.data)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <Select id="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Selecione uma categoria</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Data da despesa</Label>
          <Input id="expenseDate" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
