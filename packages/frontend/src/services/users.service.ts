import { apiFetch } from '@/services/api'
import type { User } from '@/types'

export function listUsers() {
  return apiFetch<User[]>('/users')
}
