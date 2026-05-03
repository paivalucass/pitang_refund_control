import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { login } from '@/services/auth.service'

jest.mock('@/services/auth.service', () => ({
  login: jest.fn(),
  register: jest.fn(),
}))

function Harness() {
  const auth = useAuth()
  return (
    <div>
      <span>{auth.user?.name ?? 'sem usuario'}</span>
      <button type="button" onClick={() => void auth.login('ana@pitang.com', '123456')}>login</button>
      <button type="button" onClick={auth.logout}>logout</button>
    </div>
  )
}

test('login salva usuario e logout limpa estado', async () => {
  ;(login as jest.Mock).mockResolvedValueOnce({
    token: 'token-1',
    refreshToken: 'refresh-token-1',
    user: {
      id: 'user-1',
      name: 'Ana',
      email: 'ana@pitang.com',
      role: 'EMPLOYEE',
      createdAt: '',
      updatedAt: '',
    },
  })

  render(
    <MemoryRouter>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </MemoryRouter>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'login' }))
  await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())

  await userEvent.click(screen.getByRole('button', { name: 'logout' }))
  expect(screen.getByText('sem usuario')).toBeInTheDocument()
})
