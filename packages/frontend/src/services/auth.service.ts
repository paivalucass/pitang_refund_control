import { apiFetch } from '@/services/api'
import type { LoginResponse, User, UserRole } from '@/types'

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(name: string, email: string, password: string, role: UserRole) {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  })
}
