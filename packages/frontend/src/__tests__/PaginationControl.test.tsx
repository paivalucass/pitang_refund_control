import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationControl } from '@/components/PaginationControl'

describe('PaginationControl', () => {
  it('does not render when there is only one page', () => {
    const { container } = render(<PaginationControl currentPage={1} totalPages={1} onPageChange={jest.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('disables previous on the first page and moves to the next page', async () => {
    const onPageChange = jest.fn()
    render(<PaginationControl currentPage={1} totalPages={3} onPageChange={onPageChange} />)

    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /próxima página/i }))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables next on the last page and moves to the previous page', async () => {
    const onPageChange = jest.fn()
    render(<PaginationControl currentPage={3} totalPages={3} onPageChange={onPageChange} />)

    expect(screen.getByRole('button', { name: /próxima página/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /página anterior/i }))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('renders page numbers with ellipsis and marks the current page', async () => {
    const onPageChange = jest.fn()
    render(<PaginationControl currentPage={5} totalPages={10} onPageChange={onPageChange} />)

    expect(screen.getAllByText('...')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(screen.getByRole('button', { name: '10' }))
    expect(onPageChange).toHaveBeenCalledWith(10)
  })
})
