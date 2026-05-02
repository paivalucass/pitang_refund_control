import * as React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

const TOAST_EVENT = 'app-toast'

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; variant: ToastVariant }>).detail
      const id = Date.now()

      setItems((current) => [
        ...current,
        {
          id,
          message: detail.message,
          variant: detail.variant,
        },
      ])

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id))
      }, 3500)
    }

    window.addEventListener(TOAST_EVENT, onToast)
    return () => window.removeEventListener(TOAST_EVENT, onToast)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {items.map((item) => {
        const Icon = item.variant === 'success' ? CheckCircle2 : XCircle

        return (
          <div
            className={cn(
              'flex items-start gap-3 rounded-md border bg-white p-4 text-sm shadow-lg',
              item.variant === 'success' && 'border-green-200 text-green-900',
              item.variant === 'error' && 'border-red-200 text-red-900',
            )}
            key={item.id}
            role="status"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{item.message}</p>
          </div>
        )
      })}
    </div>
  )
}

function dispatchToast(message: string, variant: ToastVariant) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, variant } }))
}

export const toast = {
  success(message: string) {
    dispatchToast(message, 'success')
  },
  error(message: string) {
    dispatchToast(message, 'error')
  },
}
