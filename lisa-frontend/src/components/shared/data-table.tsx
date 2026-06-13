import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"

import { CenteredLoader } from "@/components/shared/page-shell"

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  align?: "left" | "right" | "center"
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyMessage?: string
  getRowId: (row: T) => string
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  emptyMessage = "Записів не знайдено.",
  getRowId,
  actions,
}: DataTableProps<T>) {
  if (isLoading) return <CenteredLoader />
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Повторити
            </Button>
          ) : undefined
        }
      >
        {error.message}
      </Alert>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align ?? "left"}>
                <Typography variant="subtitle2">{col.header}</Typography>
              </TableCell>
            ))}
            {actions ? <TableCell align="right">Дії</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={getRowId(row)}
                sx={{
                  bgcolor: index % 2 === 0 ? "background.paper" : "action.hover",
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align ?? "left"}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {actions ? (
                  <TableCell align="right">{actions(row)}</TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
