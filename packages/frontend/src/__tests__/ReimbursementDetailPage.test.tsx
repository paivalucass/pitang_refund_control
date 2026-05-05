import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ReimbursementDetailPage } from '@/pages/ReimbursementDetailPage'
import { addAttachment } from '@/services/reimbursements.service'

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Ana', email: 'ana@pitang.com', role: 'EMPLOYEE' },
  }),
}))

jest.mock('@/services/reimbursements.service', () => ({
  addAttachment: jest.fn(),
  approveReimbursement: jest.fn(),
  cancelReimbursement: jest.fn(),
  getHistory: jest.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
  }),
  getReimbursement: jest.fn().mockResolvedValue({
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
  }),
  listAttachments: jest.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
  }),
  payReimbursement: jest.fn(),
  rejectReimbursement: jest.fn(),
  removeAttachment: jest.fn(),
  submitReimbursement: jest.fn(),
}))

test('mostra erro ao anexar arquivo acima de 5MB', async () => {
  render(
    <MemoryRouter initialEntries={['/reimbursements/req-1']}>
      <Routes>
        <Route path="/reimbursements/:id" element={<ReimbursementDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  await waitFor(() => expect(screen.getByRole('heading', { name: 'Taxi' })).toBeInTheDocument())
  await userEvent.click(screen.getByRole('button', { name: /^anexo$/i }))

  const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'nota.pdf', { type: 'application/pdf' })
  await userEvent.upload(screen.getByLabelText(/arquivo/i), oversizedFile)

  expect(screen.getByText('Anexe apenas arquivos PDF, JPG ou PNG com até 5MB.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /adicionar/i })).toBeDisabled()
  expect(addAttachment).not.toHaveBeenCalled()
})
