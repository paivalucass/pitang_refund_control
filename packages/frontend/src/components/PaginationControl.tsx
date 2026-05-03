import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationControlProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages])
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 0 && page <= totalPages) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
}

export function PaginationControl({ currentPage, totalPages, onPageChange }: PaginationControlProps) {
  if (totalPages <= 1) return null

  const pages = getPages(currentPage, totalPages)

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2 pt-4" aria-label="Paginação">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Página anterior"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>
      <div className="flex items-center gap-1">
        {pages.map((page, index) => (
          <div className="flex items-center gap-1" key={page}>
            {index > 0 && page - pages[index - 1] > 1 ? (
              <span className="px-2 text-sm text-slate-500">...</span>
            ) : null}
            <Button
              type="button"
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Próxima página"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
