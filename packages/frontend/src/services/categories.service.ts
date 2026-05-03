import { apiFetch } from '@/services/api'
import type { Category, PaginatedResponse } from '@/types'

export function listCategories(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Category>>(`/categories?page=${page}&limit=${limit}`)
}

export function createCategory(name: string) {
  return apiFetch<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateCategory(id: string, data: Partial<Pick<Category, 'name' | 'active'>>) {
  return apiFetch<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
