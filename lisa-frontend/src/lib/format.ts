import { format, parseISO } from "date-fns"
import { uk } from "date-fns/locale"

const ENUM_LABELS: Record<string, string> = {
  AGRONOMIST: "Агроном",
  SALES_MANAGER: "Менеджер з продажу",
  FARM_MANAGER: "Керівник ферми",
  PLANNED: "Заплановано",
  IN_PROGRESS: "В процесі",
  COMPLETED: "Завершено",
  FAILED: "Невдало",
  AVAILABLE: "Доступна",
  IN_USE: "В використанні",
  MAINTENANCE: "На обслуговуванні",
  OUT_OF_SERVICE: "Не в роботі",
  PENDING: "Очікує",
  PARTIAL: "Частково",
  PAID: "Сплачено",
  fields: "Поля",
  crops: "Культури",
  plantings: "Посіви",
  workRecords: "Записи робіт",
  machinery: "Техніка",
  harvestStock: "Запаси врожаю",
  suppliers: "Постачальники",
  fertilizers: "Добрива",
  purchases: "Закупівлі",
  buyers: "Покупці",
  sales: "Продажі",
}

export function formatDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: uk })
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "d MMM yyyy HH:mm", { locale: uk })
  } catch {
    return value
  }
}

export function formatNumber(value?: string | number | null, decimals = 2) {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString("uk-UA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString("uk-UA", {
    style: "currency",
    currency: "USD",
  })
}

export function toInputDate(value?: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

export function formatEnumLabel(value: string) {
  if (ENUM_LABELS[value]) return ENUM_LABELS[value]

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
