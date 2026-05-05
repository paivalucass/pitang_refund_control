import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { NewReimbursementPage } from '@/pages/NewReimbursementPage'
import { addAttachment, createReimbursement } from '@/services/reimbursements.service'

jest.mock('@/services/categories.service', () => ({
  listCategories: jest.fn().mockResolvedValue({
    data: [
      { id: 'cat-1', name: 'Alimentação', active: true, createdAt: '', updatedAt: '' },
    ],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  }),
}))

jest.mock('@/services/reimbursements.service', () => ({
  createReimbursement: jest.fn().mockResolvedValue({ id: 'req-1' }),
  addAttachment: jest.fn().mockResolvedValue({ id: 'att-1' }),
  extractDataFromAttachment: jest.fn().mockResolvedValue({}),
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

test('envia anexos selecionados depois de criar a solicitacao', async () => {
  render(
    <MemoryRouter>
      <NewReimbursementPage />
    </MemoryRouter>,
  )

  const attachment = new File(['nota'], 'nota.pdf', { type: 'application/pdf' })

  await waitFor(() => expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument())
  await userEvent.selectOptions(screen.getByLabelText(/categoria/i), 'cat-1')
  await userEvent.type(screen.getByLabelText(/descrição/i), 'Almoço com cliente')
  await userEvent.type(screen.getByLabelText(/valor/i), '120')
  await userEvent.type(screen.getByLabelText(/data da despesa/i), '2026-05-01')
  await userEvent.upload(screen.getByLabelText(/anexos/i), attachment)
  await userEvent.click(screen.getByRole('button', { name: /criar solicitação/i }))

  await waitFor(() => expect(addAttachment).toHaveBeenCalledWith('req-1', attachment))
})
