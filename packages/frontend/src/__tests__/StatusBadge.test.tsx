import { render, screen } from '@testing-library/react'
import { StatusBadge, statusLabels } from '@/components/StatusBadge'
import type { RequestStatus } from '@/types'

test.each(Object.entries(statusLabels))('renderiza o status %s', (status, label) => {
  render(<StatusBadge status={status as RequestStatus} />)
  expect(screen.getByText(label)).toBeInTheDocument()
})
