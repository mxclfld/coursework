import { createCrudService } from "@/api/client"
import type { Культура } from "@/api/types"

export interface CropQueryParams {
  search?: string
  type?: string
  page?: number
  limit?: number
}

export interface CreateCropInput {
  name: string
  type: string
  description?: string
}

const base = createCrudService<Crop, CreateCropInput>("/crops")

export const cropsService = {
  ...base,
  getAll: (params?: CropQueryParams) => base.getAll(params),
}
