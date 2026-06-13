export type UserRole = "AGRONOMIST" | "SALES_MANAGER" | "FARM_MANAGER"
export type PlantingStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
export type MachineryStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE"
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID"

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface User {
  id: string
  fullName: string
  username: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: User
}

export interface Field {
  id: string
  name: string
  area: string | number
  location: string
  availableArea: string | number
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Crop {
  id: string
  name: string
  type: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Planting {
  id: string
  fieldId: string
  cropId: string
  plantingDate: string
  plantedArea: string | number
  status: PlantingStatus
  createdById: string
  field?: Field
  crop?: Crop
  createdBy?: Pick<User, "id" | "fullName">
  createdAt?: string
  updatedAt?: string
}

export interface AgriculturalWork {
  id: string
  workType: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Machinery {
  id: string
  name: string
  inventoryNumber: string
  equipmentType: string
  purpose?: string | null
  status: MachineryStatus
  createdAt?: string
  updatedAt?: string
}

export interface WorkRecord {
  id: string
  fieldId: string
  agriculturalWorkId: string
  machineryId?: string | null
  completionDate: string
  description?: string | null
  createdById: string
  field?: Field
  agriculturalWork?: AgriculturalWork
  machinery?: Machinery | null
  createdBy?: Pick<User, "id" | "fullName">
  createdAt?: string
  updatedAt?: string
}

export interface MachineryUsage {
  id: string
  machineryId: string
  workRecordId: string
  usageDate: string
  operatingHours: string | number
  machinery?: Machinery
  workRecord?: WorkRecord
  createdAt?: string
  updatedAt?: string
}

export interface Supplier {
  id: string
  name: string
  contactNumber?: string | null
  address?: string | null
  additionalInfo?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Fertilizer {
  id: string
  name: string
  type: string
  unit: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface FertilizerPurchase {
  id: string
  supplierId: string
  fertilizerId: string
  quantity: string | number
  unitPrice: string | number
  totalAmount: string | number
  purchaseDate: string
  paymentStatus: PaymentStatus
  createdById: string
  supplier?: Supplier
  fertilizer?: Fertilizer
  createdBy?: Pick<User, "id" | "fullName">
  createdAt?: string
  updatedAt?: string
}

export interface Buyer {
  id: string
  name: string
  contactNumber?: string | null
  address?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Sale {
  id: string
  buyerId: string
  cropId: string
  fieldId: string
  quantitySold: string | number
  unitPrice: string | number
  totalAmount: string | number
  saleDate: string
  createdById: string
  buyer?: Buyer
  crop?: Crop
  field?: Field
  createdBy?: Pick<User, "id" | "fullName">
  createdAt?: string
  updatedAt?: string
}

export interface HarvestStock {
  id: string
  cropId: string
  fieldId: string
  totalQuantity: string | number
  availableBalance: string | number
  unit: string
  crop?: Crop
  field?: Field
  createdAt?: string
  updatedAt?: string
}

export interface FinancialReport {
  totalRevenue: number
  totalCosts: number
  profit: number
  salesCount: number
  purchasesCount: number
}

export interface DashboardResponse {
  role: UserRole
  summary: Record<string, number>
  financial?: FinancialReport
}

export interface MessageResponse {
  message: string
}
