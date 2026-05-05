import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import { firstZodError, reimbursementSchema } from '@/lib/validation'
import type { Category } from '@/types'
import { extractDataFromAttachment, type ReimbursementFormData } from '@/services/reimbursements.service'

const ACCEPTED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024

type ReimbursementFormProps = {
  categories: Category[]
  initialValues?: Partial<ReimbursementFormData>
  submitLabel: string
  loading?: boolean
  attachments?: File[]
  onAttachmentsChange?: (files: File[]) => void
  onSubmit: (data: ReimbursementFormData) => void
}

export function ReimbursementForm({
  categories,
  initialValues,
  submitLabel,
  loading = false,
  attachments,
  onAttachmentsChange,
  onSubmit,
}: ReimbursementFormProps) {
  const [categoryId, setCategoryId] = React.useState(initialValues?.categoryId ?? '')
  const [description, setDescription] = React.useState(initialValues?.description ?? '')
  const [amount, setAmount] = React.useState(initialValues?.amount?.toString() ?? '')
  const [expenseDate, setExpenseDate] = React.useState(initialValues?.expenseDate ?? '')
  const [error, setError] = React.useState('')
  const [extracting, setExtracting] = React.useState(false)
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null)
  const extractionRunRef = React.useRef(0)
  const activeCategories = categories.filter((category) => category.active)
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const selectedLimit = selectedCategory?.valueLimit

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

    if (selectedLimit !== null && selectedLimit !== undefined && result.data.amount > Number(selectedLimit)) {
      setError(`O valor máximo para ${selectedCategory?.name} é ${formatCurrency(selectedLimit)}.`)
      return
    }

    onSubmit(result.data)
  }

  async function handleAttachmentsChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const invalidFile = files.find((file) => !ACCEPTED_ATTACHMENT_TYPES.includes(file.type) || file.size > MAX_ATTACHMENT_SIZE)
    if (invalidFile) {
      setError('Anexe apenas arquivos PDF, JPG ou PNG com até 5MB cada.')
      event.target.value = ''
      onAttachmentsChange?.([])
      return
    }

    setError('')
    onAttachmentsChange?.(files)
    if (!files[0]) return

    const extractionRun = extractionRunRef.current + 1
    extractionRunRef.current = extractionRun
    setExtracting(true)
    try {
      const extracted = await extractDataFromAttachment(files[0])
      if (extractionRunRef.current !== extractionRun) return
      if (extracted.amount !== undefined) setAmount(String(extracted.amount))
      if (extracted.expenseDate) setExpenseDate(extracted.expenseDate)
      if (extracted.description) setDescription((current) => current || extracted.description || '')
      if (extracted.categoryName) {
        const matchedCategory = activeCategories.find((category) => normalizeCategory(category.name) === normalizeCategory(extracted.categoryName ?? ''))
        if (matchedCategory) setCategoryId(matchedCategory.id)
      }
    } catch {
      if (extractionRunRef.current !== extractionRun) return
      setError('Não foi possível analisar o comprovante automaticamente. Você ainda pode preencher os campos manualmente.')
    } finally {
      if (extractionRunRef.current === extractionRun) setExtracting(false)
    }
  }

  function handleRemoveAttachment(index: number) {
    const nextFiles = attachments?.filter((_file, fileIndex) => fileIndex !== index) ?? []
    extractionRunRef.current += 1
    setExtracting(false)
    onAttachmentsChange?.(nextFiles)
    if (nextFiles.length === 0 && attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
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
        {selectedLimit !== null && selectedLimit !== undefined ? (
          <p className="text-xs text-slate-500">Limite da categoria: {formatCurrency(selectedLimit)}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            max={selectedLimit !== null && selectedLimit !== undefined ? Number(selectedLimit) : undefined}
            min="0.01"
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Data da despesa</Label>
          <Input id="expenseDate" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
        </div>
      </div>
      {onAttachmentsChange ? (
        <div className="space-y-2">
          <Label htmlFor="attachments">Anexos</Label>
          <Input
            id="attachments"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            multiple
            ref={attachmentInputRef}
            type="file"
            onChange={handleAttachmentsChange}
          />
          <p className="text-xs text-slate-500">Formatos aceitos: PDF, JPG ou PNG até 5MB cada.</p>
          {extracting ? <p className="text-xs font-medium text-red-700">Analisando comprovante...</p> : null}
          {attachments?.length ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {attachments.map((file, index) => (
                <li className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2" key={`${file.name}-${file.size}-${index}`}>
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <Button
                    aria-label={`Remover anexo ${file.name}`}
                    className="h-7 w-7 shrink-0 p-0"
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}

function normalizeCategory(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}
