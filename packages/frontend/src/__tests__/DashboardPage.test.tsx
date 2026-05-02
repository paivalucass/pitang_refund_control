import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from '@/pages/DashboardPage'
import { listReimbursements } from '@/services/reimbursements.service'

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Ana', email: 'ana@pitang.com', role: 'EMPLOYEE' },
  }),
}))

jest.mock('@/services/reimbursements.service', () => ({
  listReimbursements: jest.fn(),
  submitReimbursement: jest.fn(),
  cancelReimbursement: jest.fn(),
  approveReimbursement: jest.fn(),
  payReimbursement: jest.fn(),
}))

test('renderiza lista de reembolsos', async () => {
  ;(listReimbursements as jest.Mock).mockResolvedValueOnce([
    {
      id: 'req-1',
      requesterId: 'user-1',
      categoryId: 'cat-1',
      description: 'Taxi',
      amount: 52.5,
      expenseDate: '2026-05-01T00:00:00.000Z',
      status: 'DRAFT',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      requester: { id: 'user-1', name: 'Ana', email: 'ana@pitang.com', role: 'EMPLOYEE' },
      category: { id: 'cat-1', name: 'Transporte', active: true, createdAt: '', updatedAt: '' },
      attachments: [],
    },
  ])

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.getByText('Taxi')).toBeInTheDocument())
  expect(screen.getByText('Editar')).toBeInTheDocument()
})

test('renderiza estado vazio', async () => {
  ;(listReimbursements as jest.Mock).mockResolvedValueOnce([])

  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.getByText(/nenhuma solicitação encontrada/i)).toBeInTheDocument())
})
