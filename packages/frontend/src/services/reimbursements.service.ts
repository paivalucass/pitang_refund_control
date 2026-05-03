import { apiFetch } from '@/services/api'
import type { Attachment, AttachmentType, PaginatedResponse, Reimbursement, RequestHistory } from '@/types'

export type ReimbursementFormData = {
  categoryId: string
  description: string
  amount: number
  expenseDate: string
}

export function listReimbursements(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Reimbursement>>(`/reimbursements?page=${page}&limit=${limit}`)
}

export function listPastReimbursements(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Reimbursement>>(`/reimbursements/history?page=${page}&limit=${limit}`)
}

export function getReimbursement(id: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}`)
}

export function createReimbursement(data: ReimbursementFormData) {
  return apiFetch<Reimbursement>('/reimbursements', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateReimbursement(id: string, data: ReimbursementFormData) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function submitReimbursement(id: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}/submit`, { method: 'POST' })
}

export function approveReimbursement(id: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}/approve`, { method: 'POST' })
}

export function rejectReimbursement(id: string, rejectionReason: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  })
}

export function payReimbursement(id: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}/pay`, { method: 'POST' })
}

export function cancelReimbursement(id: string) {
  return apiFetch<Reimbursement>(`/reimbursements/${id}/cancel`, { method: 'POST' })
}

export function getHistory(id: string, page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<RequestHistory>>(`/reimbursements/${id}/history?page=${page}&limit=${limit}`)
}

export function addAttachment(
  id: string,
  data: { fileName: string; fileUrl: string; fileType: AttachmentType },
) {
  return apiFetch<Attachment>(`/reimbursements/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listAttachments(id: string, page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Attachment>>(`/reimbursements/${id}/attachments?page=${page}&limit=${limit}`)
}
