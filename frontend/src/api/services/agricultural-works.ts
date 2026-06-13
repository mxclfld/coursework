import { createCrudService } from "@/api/client"
import type { AgriculturalWork } from "@/api/types"

export interface AgriculturalWorkQueryParams {
  search?: string
  page?: number
  limit?: number
}

export interface CreateAgriculturalWorkInput {
  workType: string
  description?: string
}

const base = createCrudService<AgriculturalWork, CreateAgriculturalWorkInput>(
  "/agricultural-works"
)

export const agriculturalWorksService = {
  ...base,
  getAll: (params?: AgriculturalWorkQueryParams) => base.getAll(params),
}
