import { apiFetch } from '@/services/api'
import type { Category } from '@/types'

export function listCategories() {
  return apiFetch<Category[]>('/categories')
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
