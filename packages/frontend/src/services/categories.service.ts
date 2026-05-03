import { apiFetch } from '@/services/api'
import type { Category, PaginatedResponse } from '@/types'

export type CategoryListFilters = {
  search?: string
  active?: boolean | ''
}

export function listCategories(page = 1, limit = 10, filters: CategoryListFilters = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.search) params.set('search', filters.search)
  if (filters.active !== '' && filters.active !== undefined) params.set('active', String(filters.active))
  return apiFetch<PaginatedResponse<Category>>(`/categories?${params.toString()}`)
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
