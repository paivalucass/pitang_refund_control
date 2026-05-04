import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { File, Paperclip } from 'lucide-react'
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
  approveReimbursement,
  cancelReimbursement,
  getHistory,
  getReimbursement,
  listAttachments,
  payReimbursement,
  rejectReimbursement,
  submitReimbursement,
} from '@/services/reimbursements.service'
import type { ApiError, Attachment, PaginationMeta, Reimbursement, RequestHistory } from '@/types'

const PAGE_SIZE = 10
const initialMeta: PaginationMeta = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }

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
    if (!attachmentFile) return
    await addAttachment(id, attachmentFile)
    toast.success('Anexo adicionado com sucesso.')
    setAttachmentFile(null)
    setAttachmentOpen(false)
    setAttachmentsPage(1)
    await load()
  }

  function confirmAction(title: string, action: () => Promise<void>) {
    setConfirm({ title, description: 'Confirma esta alteração de status?', action })
  }

  const canEdit = user?.role === 'EMPLOYEE' && request?.status === 'DRAFT' && request.requesterId === user.id

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
          </div>

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
          if (!open) setAttachmentFile(null)
        }}
        title="Adicionar anexo"
      >
        <form className="space-y-4" onSubmit={handleAttachment}>
          <div className="space-y-2">
            <Label htmlFor="attachmentFile">Arquivo</Label>
            <Input
              id="attachmentFile"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              type="file"
              onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-slate-500">Formatos aceitos: PDF, JPG ou PNG até 5MB.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setAttachmentOpen(false)
              setAttachmentFile(null)
            }}>Voltar</Button>
            <Button type="submit" disabled={!attachmentFile}>Adicionar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  )
}
