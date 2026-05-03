import { apiFetch } from '@/services/api'
import type { PaginatedResponse, User, UserRole } from '@/types'

export type UserListFilters = {
  search?: string
  role?: UserRole | ''
}

export function listUsers(page = 1, limit = 10, filters: UserListFilters = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.search) params.set('search', filters.search)
  if (filters.role) params.set('role', filters.role)
  return apiFetch<PaginatedResponse<User>>(`/users?${params.toString()}`)
}
