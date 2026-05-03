import { apiFetch } from '@/services/api'
import type { PaginatedResponse, User } from '@/types'

export function listUsers(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`)
}
