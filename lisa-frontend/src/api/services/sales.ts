import { createCrudService } from "@/api/client"
import type { Sale } from "@/api/types"

export interface SaleQueryParams {
  buyerId?: string
  cropId?: string
  fieldId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreateSaleInput {
  buyerId: string
  cropId: string
  fieldId: string
  quantitySold: number
  unitPrice: number
  saleDate: string
}

const base = createCrudService<Sale, CreateSaleInput>("/sales")

export const salesService = {
  ...base,
  getAll: (params?: SaleQueryParams) => base.getAll(params),
}
