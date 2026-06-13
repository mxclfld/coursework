import { format, parseISO } from "date-fns"

export function formatDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm")
  } catch {
    return value
  }
}

export function formatNumber(value?: string | number | null, decimals = 2) {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  })
}

export function toInputDate(value?: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
