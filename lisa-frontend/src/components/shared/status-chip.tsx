import { Chip, type ChipProps } from "@mui/material"

import { formatEnumLabel } from "@/lib/format"

const colorMap: Record<string, ChipProps["color"]> = {
  PLANNED: "default",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  FAILED: "error",
  AVAILABLE: "success",
  IN_USE: "info",
  MAINTENANCE: "warning",
  OUT_OF_SERVICE: "error",
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
}

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={formatEnumLabel(status)}
      color={colorMap[status] ?? "default"}
      variant="outlined"
    />
  )
}
