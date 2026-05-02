import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { NewReimbursementPage } from '@/pages/NewReimbursementPage'
import { createReimbursement } from '@/services/reimbursements.service'

jest.mock('@/services/categories.service', () => ({
  listCategories: jest.fn().mockResolvedValue([
    { id: 'cat-1', name: 'Alimentação', active: true, createdAt: '', updatedAt: '' },
  ]),
}))

jest.mock('@/services/reimbursements.service', () => ({
  createReimbursement: jest.fn().mockResolvedValue({ id: 'req-1' }),
}))

test('valida campos obrigatorios', async () => {
  render(
    <MemoryRouter>
      <NewReimbursementPage />
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.getByText(/dados da despesa/i)).toBeInTheDocument())
  await userEvent.click(screen.getByRole('button', { name: /criar solicitação/i }))

  expect(screen.getByText(/preencha todos os campos/i)).toBeInTheDocument()
})

test('envia formulario preenchido', async () => {
  render(
    <MemoryRouter>
      <NewReimbursementPage />
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument())
  await userEvent.selectOptions(screen.getByLabelText(/categoria/i), 'cat-1')
  await userEvent.type(screen.getByLabelText(/descrição/i), 'Almoço com cliente')
  await userEvent.type(screen.getByLabelText(/valor/i), '120')
  await userEvent.type(screen.getByLabelText(/data da despesa/i), '2026-05-01')
  await userEvent.click(screen.getByRole('button', { name: /criar solicitação/i }))

  expect(createReimbursement).toHaveBeenCalledWith({
    categoryId: 'cat-1',
    description: 'Almoço com cliente',
    amount: 120,
    expenseDate: '2026-05-01',
  })
})
