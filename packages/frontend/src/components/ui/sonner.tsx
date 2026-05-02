export function Toaster() {
  return null
}

export const toast = {
  success(message: string) {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: message }))
  },
  error(message: string) {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: message }))
  },
}
