import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/types'

const labels: Record<RequestStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PAID: 'Paga',
  CANCELED: 'Cancelada',
}

const colors: Record<RequestStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAID: 'bg-teal-100 text-teal-700',
  CANCELED: 'bg-orange-100 text-orange-700',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={cn('border-transparent', colors[status])}>{labels[status]}</Badge>
}

export { labels as statusLabels }
