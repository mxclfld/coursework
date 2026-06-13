import { createCrudService } from "@/api/client"
import type { Fertilizer } from "@/api/types"

export interface FertilizerQueryParams {
  search?: string
  type?: string
  page?: number
  limit?: number
}

export interface CreateFertilizerInput {
  name: string
  type: string
  unit: string
  description?: string
}

const base = createCrudService<Fertilizer, CreateFertilizerInput>("/fertilizers")

export const fertilizersService = {
  ...base,
  getAll: (params?: FertilizerQueryParams) => base.getAll(params),
}
