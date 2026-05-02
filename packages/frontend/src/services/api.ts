import type { ApiError } from '@/types'

const BASE_URL = '/api'
const TOKEN_KEY = 'pitang_refund_token'
const USER_KEY = 'pitang_refund_user'

export { TOKEN_KEY, USER_KEY }

function parseApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'message' in body) {
    return { ...(body as ApiError), statusCode: status }
  }
  return { message: 'Erro inesperado ao comunicar com a API', statusCode: status }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
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
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    throw parseApiError(response.status, body)
  }

  return body as T
}
