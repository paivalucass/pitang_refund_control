import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { File, Paperclip, SearchCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/sonner'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState } from '@/components/ErrorState'
import { LoadingTable } from '@/components/LoadingTable'
import { PaginationControl } from '@/components/PaginationControl'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import {
  addAttachment,
  analyzeReimbursement,
  approveReimbursement,
  cancelReimbursement,
  getHistory,
  getReimbursement,
  listAttachments,
  payReimbursement,
  rejectReimbursement,
  submitReimbursement,
  type ReimbursementAnalysis,
} from '@/services/reimbursements.service'
import type { ApiError, Attachment, PaginationMeta, Reimbursement, RequestHistory } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
const ACCEPTED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ATTACHMENT_ERROR_MESSAGE = 'Anexe apenas arquivos PDF, JPG ou PNG com até 5MB.'

export function ReimbursementDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = React.useState<Reimbursement | null>(null)
  const [history, setHistory] = React.useState<RequestHistory[]>([])
  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const [historyPage, setHistoryPage] = React.useState(1)
  const [attachmentsPage, setAttachmentsPage] = React.useState(1)
  const [historyMeta, setHistoryMeta] = React.useState<PaginationMeta>(initialMeta)
  const [attachmentsMeta, setAttachmentsMeta] = React.useState<PaginationMeta>(initialMeta)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [confirm, setConfirm] = React.useState<{ title: string; description: string; action: () => Promise<void> } | null>(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState('')
  const [attachmentOpen, setAttachmentOpen] = React.useState(false)
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null)
  const [attachmentError, setAttachmentError] = React.useState('')
  const [analysis, setAnalysis] = React.useState<ReimbursementAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = React.useState(false)
  const [analysisError, setAnalysisError] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [requestData, historyData, attachmentsData] = await Promise.all([
        getReimbursement(id),
        getHistory(id, historyPage, PAGE_SIZE),
        listAttachments(id, attachmentsPage, PAGE_SIZE),
      ])
      if (historyData.data.length === 0 && historyData.meta.total > 0 && historyPage > historyData.meta.totalPages) {
        setHistoryPage(historyData.meta.totalPages)
        return
      }
      if (attachmentsData.data.length === 0 && attachmentsData.meta.total > 0 && attachmentsPage > attachmentsData.meta.totalPages) {
        setAttachmentsPage(attachmentsData.meta.totalPages)
        return
      }
      setRequest(requestData)
      setHistory(historyData.data)
      setHistoryMeta(historyData.meta)
      setAttachments(attachmentsData.data)
      setAttachmentsMeta(attachmentsData.meta)
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível carregar a solicitação.')
    } finally {
      setLoading(false)
    }
  }, [attachmentsPage, historyPage, id])

  React.useEffect(() => {
    void load()
  }, [load])

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    await action()
    toast.success(successMessage)
    await load()
  }

  async function runManagerAction(action: () => Promise<unknown>, successMessage: string) {
    await action()
    toast.success(successMessage)
    navigate('/dashboard')
  }

  async function handleReject(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rejectionReason.trim()) return
    await runManagerAction(() => rejectReimbursement(id, rejectionReason), 'Solicitação rejeitada com sucesso.')
    setRejectOpen(false)
    setRejectionReason('')
  }

  async function handleAttachment(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttachmentError('')
    if (!attachmentFile) {
      setAttachmentError('Selecione um arquivo para anexar.')
      return
    }
    if (!isValidAttachment(attachmentFile)) {
      setAttachmentError(ATTACHMENT_ERROR_MESSAGE)
      return
    }

    try {
      await addAttachment(id, attachmentFile)
      toast.success('Anexo adicionado com sucesso.')
      setAttachmentFile(null)
      setAttachmentOpen(false)
      setAttachmentsPage(1)
      await load()
    } catch (err) {
      setAttachmentError((err as ApiError).message || 'Não foi possível adicionar o anexo.')
    }
  }

  function handleAttachmentFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setAttachmentFile(null)
      setAttachmentError('')
      return
    }

    if (!isValidAttachment(file)) {
      setAttachmentFile(null)
      setAttachmentError(ATTACHMENT_ERROR_MESSAGE)
      event.target.value = ''
      return
    }

    setAttachmentFile(file)
    setAttachmentError('')
  }

  function confirmAction(title: string, action: () => Promise<void>) {
    setConfirm({ title, description: 'Confirma esta alteração de status?', action })
  }

  const canEdit = user?.role === 'EMPLOYEE' && request?.status === 'DRAFT' && request.requesterId === user.id
  const canAnalyze =
    (user?.role === 'MANAGER' && request?.status === 'SUBMITTED') ||
    (user?.role === 'FINANCE' && request?.status === 'APPROVED')

  async function handleAnalysis() {
    setAnalysisLoading(true)
    setAnalysisError('')
    try {
      const result = await analyzeReimbursement(id)
      setAnalysis(result)
    } catch (err) {
      setAnalysisError((err as ApiError).message || 'Não foi possível analisar os anexos.')
    } finally {
      setAnalysisLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {loading ? <LoadingTable rows={4} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {request ? (
        <>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-semibold">{request.description}</h1>
              <p className="text-sm text-slate-500">Solicitação criada em {formatDateTime(request.createdAt)}</p>
            </div>
            <StatusBadge className="px-4 py-1.5 text-sm" status={request.status} />
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <>
                <Button type="button" variant="outline" onClick={() => navigate(`/reimbursements/${id}/edit`)}>
                  Editar
                </Button>
                <Button type="button" onClick={() => confirmAction('Enviar para análise', async () => runAction(() => submitReimbursement(id), 'Solicitação enviada para análise.'))}>
                  Enviar para Análise
                </Button>
                <Button type="button" variant="destructive" onClick={() => confirmAction('Cancelar solicitação', async () => runAction(() => cancelReimbursement(id), 'Solicitação cancelada com sucesso.'))}>
                  Cancelar
                </Button>
                <Button type="button" variant="outline" onClick={() => setAttachmentOpen(true)}>
                  <Paperclip className="h-4 w-4" />
                  Anexo
                </Button>
              </>
            ) : null}
            {user?.role === 'MANAGER' && request.status === 'SUBMITTED' ? (
              <>
                <Button type="button" onClick={() => confirmAction('Aprovar solicitação', async () => runManagerAction(() => approveReimbursement(id), 'Solicitação aprovada com sucesso.'))}>
                  Aprovar
                </Button>
                <Button type="button" variant="destructive" onClick={() => setRejectOpen(true)}>
                  Rejeitar
                </Button>
              </>
            ) : null}
            {user?.role === 'FINANCE' && request.status === 'APPROVED' ? (
              <Button type="button" onClick={() => confirmAction('Marcar como pago', async () => runAction(() => payReimbursement(id), 'Solicitação marcada como paga.'))}>
                Marcar como Pago
              </Button>
            ) : null}
            {canAnalyze ? (
              <Button type="button" variant="outline" disabled={analysisLoading} onClick={() => void handleAnalysis()}>
                <SearchCheck className="h-4 w-4" />
                {analysisLoading ? 'Analisando...' : 'Analisar Anexos'}
              </Button>
            ) : null}
          </div>

          {analysisError ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{analysisError}</p> : null}
          {analysis ? <AnalysisResultCard analysis={analysis} /> : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Info label="Categoria" value={request.category.name} />
                <Info label="Valor" value={formatCurrency(request.amount)} />
                <Info label="Data da despesa" value={formatDate(request.expenseDate)} />
                <Info label="Solicitante" value={request.requester.name} />
                <div className="md:col-span-2">
                  <p className="text-sm font-medium">Perfil do solicitante</p>
                  <div className="mt-1"><RoleBadge role={request.requester.role} /></div>
                </div>
                {request.rejectionReason ? <Info label="Justificativa" value={request.rejectionReason} /> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attachments.length === 0 ? <p className="text-sm text-slate-500">Nenhum anexo cadastrado.</p> : null}
                {attachments.map((item) => (
                  <a className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-slate-50" href={item.fileUrl} key={item.id} target="_blank" rel="noreferrer">
                    {item.fileType === 'JPG' || item.fileType === 'PNG' ? (
                      <img className="h-10 w-10 rounded border object-cover" src={item.fileUrl} alt="" />
                    ) : (
                      <File className="h-4 w-4" />
                    )}
                    <span className="flex-1 truncate">{item.fileName}</span>
                    <span className="text-xs text-slate-500">{item.fileType}</span>
                  </a>
                ))}
                <PaginationControl
                  currentPage={attachmentsMeta.page}
                  totalPages={attachmentsMeta.totalPages}
                  onPageChange={setAttachmentsPage}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {history.map((item) => (
                <div className="border-l-2 pl-4" key={item.id}>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-slate-500">{item.user.name} - {formatDateTime(item.createdAt)}</p>
                  {item.note ? <p className="mt-1 text-sm">{item.note}</p> : null}
                </div>
              ))}
              <PaginationControl currentPage={historyMeta.page} totalPages={historyMeta.totalPages} onPageChange={setHistoryPage} />
            </CardContent>
          </Card>

          <p>
            <Link
              className="inline-flex h-10 items-center rounded-md bg-red-700 px-4 text-sm font-medium !text-white hover:bg-red-800"
              to="/dashboard"
            >
              Voltar ao dashboard
            </Link>
          </p>
        </>
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
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen} title="Rejeitar solicitação">
        <form onSubmit={handleReject}>
          <Label htmlFor="rejectionReason">Justificativa</Label>
          <Textarea id="rejectionReason" className="mt-2" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Voltar</Button>
            <Button type="submit" variant="destructive">Rejeitar</Button>
          </DialogFooter>
        </form>
      </Dialog>
      <Dialog
        open={attachmentOpen}
        onOpenChange={(open) => {
          setAttachmentOpen(open)
          if (!open) {
            setAttachmentFile(null)
            setAttachmentError('')
          }
        }}
        title="Adicionar anexo"
      >
        <form className="space-y-4" onSubmit={handleAttachment}>
          {attachmentError ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{attachmentError}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="attachmentFile">Arquivo</Label>
            <Input
              id="attachmentFile"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              type="file"
              onChange={handleAttachmentFileChange}
            />
            <p className="text-xs text-slate-500">Formatos aceitos: PDF, JPG ou PNG até 5MB.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setAttachmentOpen(false)
              setAttachmentFile(null)
              setAttachmentError('')
            }}>Voltar</Button>
            <Button type="submit" disabled={!attachmentFile}>Adicionar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}

function isValidAttachment(file: File) {
  return ACCEPTED_ATTACHMENT_TYPES.includes(file.type) && file.size <= MAX_ATTACHMENT_SIZE
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  )
}

function AnalysisResultCard({ analysis }: { analysis: ReimbursementAnalysis }) {
  const scoreColor =
    analysis.score >= 80
      ? 'bg-emerald-100 text-emerald-700'
      : analysis.score >= 50
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Análise automática</CardTitle>
          <Badge className={`w-fit border-transparent ${scoreColor}`}>{analysis.score.toFixed(1)}% de confiabilidade</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${scoreColor.split(' ')[0]}`} style={{ width: `${Math.min(100, Math.max(0, analysis.score))}%` }} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <AnalysisItem label="Valor" matched={analysis.matches.amount} />
          <AnalysisItem label="Data" matched={analysis.matches.expenseDate} />
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">Descrição</p>
            <p className="mt-1 text-sm text-slate-600">
              {(analysis.matches.descriptionSimilarity * 100).toFixed(1)}% similar
            </p>
          </div>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <Info label="Valor extraído" value={analysis.extracted.amount !== undefined ? formatCurrency(analysis.extracted.amount) : 'Não identificado'} />
          <Info label="Data extraída" value={analysis.extracted.expenseDate ? formatDate(analysis.extracted.expenseDate) : 'Não identificada'} />
          <Info label="Categoria provável" value={analysis.extracted.categoryName || 'Não identificada'} />
          <Info label="Descrição extraída" value={analysis.extracted.description || 'Não identificada'} />
        </div>
      </CardContent>
    </Card>
  )
}

function AnalysisItem({ label, matched }: { label: string; matched: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-medium">{label}</p>
      <p className={matched ? 'mt-1 text-sm text-emerald-700' : 'mt-1 text-sm text-red-700'}>
        {matched ? 'Compatível' : 'Divergente'}
      </p>
    </div>
  )
}
