import { api, createCrudService } from "@/api/client"
import type { Покупець, Sale } from "@/api/types"

export interface BuyerQueryParams {
  search?: string
  page?: number
  limit?: number
}

export interface CreateBuyerInput {
  name: string
  contactNumber?: string
  address?: string
}

const base = createCrudService<Buyer, CreateBuyerInput>("/buyers")

export const buyersService = {
  ...base,
  getAll: (params?: BuyerQueryParams) => base.getAll(params),
  getSales: (id: string) => api.get<never, Sale[]>(`/buyers/${id}/sales`),
}
