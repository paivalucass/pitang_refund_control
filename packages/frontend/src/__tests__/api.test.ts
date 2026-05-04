import { apiFetch, REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY } from '@/services/api'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    {
      status,
      ok: status >= 200 && status < 300,
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response,
  )
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
    global.fetch = jest.fn()
  })

  it('sends JSON requests with the bearer token', async () => {
    localStorage.setItem(TOKEN_KEY, 'access-token')
    jest.mocked(fetch).mockReturnValue(jsonResponse({ ok: true }) as ReturnType<typeof fetch>)

    await expect(apiFetch('/reimbursements', { method: 'POST', body: JSON.stringify({ amount: 10 }) })).resolves.toEqual({ ok: true })

    expect(fetch).toHaveBeenCalledWith('/api/reimbursements', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Headers),
    }))
    const headers = (jest.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('does not force JSON content type for FormData uploads', async () => {
    localStorage.setItem(TOKEN_KEY, 'access-token')
    jest.mocked(fetch).mockReturnValue(jsonResponse({ id: 'att-1' }) as ReturnType<typeof fetch>)

    await apiFetch('/reimbursements/req-1/attachments', { method: 'POST', body: new FormData() })

    const headers = (jest.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Content-Type')).toBeNull()
    expect(headers.get('Authorization')).toBe('Bearer access-token')
  })

  it('refreshes the access token and retries once after a 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token')
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token')

    const user = { id: 'user-1', name: 'Ana', email: 'ana@example.com', role: 'EMPLOYEE', createdAt: '', updatedAt: '' }
    jest.mocked(fetch)
      .mockReturnValueOnce(jsonResponse({ message: 'Unauthorized' }, 401) as ReturnType<typeof fetch>)
      .mockReturnValueOnce(jsonResponse({ token: 'new-token', refreshToken: 'new-refresh-token', user }) as ReturnType<typeof fetch>)
      .mockReturnValueOnce(jsonResponse({ data: [] }) as ReturnType<typeof fetch>)

    await expect(apiFetch('/reimbursements')).resolves.toEqual({ data: [] })

    expect(fetch).toHaveBeenNthCalledWith(2, '/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    }))
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token')
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh-token')
    expect(JSON.parse(localStorage.getItem(USER_KEY) ?? '{}')).toEqual(user)

    const retryHeaders = (jest.mocked(fetch).mock.calls[2][1] as RequestInit).headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-token')
  })
})
