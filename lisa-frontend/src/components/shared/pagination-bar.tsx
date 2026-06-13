import { TablePagination } from "@mui/material"

interface PaginationBarProps {
  page: number
  total: number
  rowsPerPage?: number
  onPageChange: (page: number) => void
}

export function PaginationBar({
  page,
  total,
  rowsPerPage = 10,
  onPageChange,
}: PaginationBarProps) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page - 1}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      rowsPerPageOptions={[rowsPerPage]}
    />
  )
}
