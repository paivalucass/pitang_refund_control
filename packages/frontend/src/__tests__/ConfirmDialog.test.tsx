import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={jest.fn()}
        title="Confirmar exclusão"
        description="Essa ação não pode ser desfeita."
        onConfirm={jest.fn()}
      />,
    )

    expect(screen.queryByText('Confirmar exclusão')).not.toBeInTheDocument()
  })

  it('calls onOpenChange when the cancel button is clicked', async () => {
    const onOpenChange = jest.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Confirmar ação"
        description="Deseja continuar?"
        onConfirm={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /voltar/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('runs the confirm callback before closing', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    const onOpenChange = jest.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Rejeitar solicitação"
        description="Confirme a rejeição."
        confirmLabel="Rejeitar"
        destructive
        onConfirm={onConfirm}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /rejeitar/i }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
