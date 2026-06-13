import { api, createCrudService } from "@/api/client"
import type { FertilizerPurchase, Supplier } from "@/api/types"

export interface SupplierQueryParams {
  search?: string
  page?: number
  limit?: number
}

export interface CreateSupplierInput {
  name: string
  contactNumber?: string
  address?: string
  additionalInfo?: string
}

const base = createCrudService<Supplier, CreateSupplierInput>("/suppliers")

export const suppliersService = {
  ...base,
  getAll: (params?: SupplierQueryParams) => base.getAll(params),
  getPurchases: (id: string) =>
    api.get<never, FertilizerPurchase[]>(`/suppliers/${id}/purchases`),
}
