import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        Сторінка {page} з {totalPages} ({total} всього)
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Попередня
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Наступна
        </Button>
      </div>
    </div>
  )
}
