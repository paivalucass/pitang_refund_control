import { Skeleton } from '@/components/ui/skeleton'

export function LoadingTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div className="grid gap-3 md:grid-cols-5" key={row}>
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton className="h-8" key={column} />
          ))}
        </div>
      ))}
    </div>
  )
}
