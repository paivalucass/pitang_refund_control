import type { ApiError } from '@/types'

declare const __API_BASE_URL__: string | undefined

const BASE_URL = typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : '/api'
const TOKEN_KEY = 'pitang_refund_token'
const REFRESH_TOKEN_KEY = 'pitang_refund_refresh_token'
const USER_KEY = 'pitang_refund_user'

export { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY }

function parseApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'message' in body) {
    return { ...(body as ApiError), statusCode: status }
  }
  return { message: 'Erro inesperado ao comunicar com a API', statusCode: status }
}

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function redirectToLogin() {
  clearAuthStorage()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok || !body?.token || !body?.refreshToken || !body?.user) {
    return false
  }

  localStorage.setItem(TOKEN_KEY, body.token)
  localStorage.setItem(REFRESH_TOKEN_KEY, body.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(body.user))
  window.dispatchEvent(new Event('pitang-auth-refreshed'))
  return true
}

export async function apiFetch<T>(url: string, options: RequestInit = {}, retryOnUnauthorized = true): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401) {
      if (retryOnUnauthorized && await refreshAccessToken()) {
        return apiFetch<T>(url, options, false)
      }
      redirectToLogin()
    }
    throw parseApiError(response.status, body)
  }

  return body as T
}
