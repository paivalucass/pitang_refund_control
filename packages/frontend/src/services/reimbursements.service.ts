import { apiFetch } from '@/services/api'
import type { Attachment, PaginatedResponse, Reimbursement, RequestHistory, RequestStatus } from '@/types'

export type ReimbursementFormData = {
  categoryId: string
  description: string
  amount: number
  expenseDate: string
}

export type ReimbursementListFilters = {
  search?: string
  categoryId?: string
  status?: RequestStatus | ''
  sortBy?: 'createdAt' | 'expenseDate' | 'amount'
  sortOrder?: 'asc' | 'desc'
}

function buildReimbursementParams(page: number, limit: number, filters: ReimbursementListFilters) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.status) params.set('status', filters.status)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  return params.toString()
}

export function listReimbursements(page = 1, limit = 10, filters: ReimbursementListFilters = {}) {
  return apiFetch<PaginatedResponse<Reimbursement>>(`/reimbursements?${buildReimbursementParams(page, limit, filters)}`)
}

export function listPastReimbursements(page = 1, limit = 10, filters: ReimbursementListFilters = {}) {
  return apiFetch<PaginatedResponse<Reimbursement>>(`/reimbursements/history?${buildReimbursementParams(page, limit, filters)}`)
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

export function addAttachment(id: string, file: File) {
  const data = new FormData()
  data.append('file', file)

  return apiFetch<Attachment>(`/reimbursements/${id}/attachments`, {
    method: 'POST',
    body: data,
  })
}

export function listAttachments(id: string, page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Attachment>>(`/reimbursements/${id}/attachments?page=${page}&limit=${limit}`)
}
