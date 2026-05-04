import { render, screen } from '@testing-library/react'
import { RoleBadge, roleLabels } from '@/components/RoleBadge'
import type { UserRole } from '@/types'

describe('RoleBadge', () => {
  it.each(Object.entries(roleLabels) as Array<[UserRole, string]>)('renders the %s label', (role, label) => {
    render(<RoleBadge role={role} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('applies role-specific styles and custom classes', () => {
    render(<RoleBadge role="ADMIN" className="extra-class" />)

    expect(screen.getByText('Admin')).toHaveClass('bg-violet-100', 'text-violet-700', 'extra-class')
  })
})
