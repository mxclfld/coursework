import { Badge } from "@/components/ui/badge"
import { formatEnumLabel } from "@/lib/format"

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PLANNED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
  AVAILABLE: "outline",
  IN_USE: "default",
  MAINTENANCE: "secondary",
  OUT_OF_SERVICE: "destructive",
  PENDING: "secondary",
  PARTIAL: "default",
  PAID: "outline",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariants[status] ?? "secondary"}>
      {formatEnumLabel(status)}
    </Badge>
  )
}
