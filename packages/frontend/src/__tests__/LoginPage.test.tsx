import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { LoginPage } from '@/pages/LoginPage'

const login = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login }),
}))

test('renderiza o formulario de login', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

  expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
})

test('mostra validacao para campos vazios', async () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

  await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

  expect(screen.getByText(/informe e-mail e senha/i)).toBeInTheDocument()
})

test('chama login ao enviar dados validos', async () => {
  login.mockResolvedValueOnce(undefined)
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

  await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@pitang.com')
  await userEvent.type(screen.getByLabelText(/senha/i), '123456')
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

  expect(login).toHaveBeenCalledWith('user@pitang.com', '123456')
})
