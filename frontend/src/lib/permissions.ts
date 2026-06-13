import type { UserRole } from "@/api/types"

export function canWriteFields(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteCrops(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWritePlantings(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteAgriculturalWorks(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteWorkRecords(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteMachinery(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteMachineryUsage(role?: UserRole | null) {
  return role === "AGRONOMIST"
}

export function canWriteSuppliers(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canWriteFertilizers(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canWriteFertilizerPurchases(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canWriteBuyers(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canWriteSales(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canWriteHarvestStock(role?: UserRole | null) {
  return role === "AGRONOMIST" || role === "SALES_MANAGER"
}

export function canAdjustHarvestStock(role?: UserRole | null) {
  return role === "SALES_MANAGER"
}

export function canManageUsers(role?: UserRole | null) {
  return role === "FARM_MANAGER"
}

export function canViewFinancialReport(role?: UserRole | null) {
  return role === "FARM_MANAGER"
}

export function canViewAgronomistReports(role?: UserRole | null) {
  return role === "AGRONOMIST" || role === "FARM_MANAGER"
}

export function canViewSalesReports(role?: UserRole | null) {
  return role === "SALES_MANAGER" || role === "FARM_MANAGER"
}

export function canViewHarvestReport(role?: UserRole | null) {
  return !!role
}

export function requireRoles(
  role: UserRole | null | undefined,
  allowed: UserRole[]
) {
  return !!role && allowed.includes(role)
}
