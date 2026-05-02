import * as React from 'react'
import type { ApiError } from '@/types'

export function useApi<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<ApiError | null>(null)

  const refetch = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      setData(response)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  React.useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
