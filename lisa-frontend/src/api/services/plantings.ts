import { api, createCrudService } from "@/api/client"
import type { Planting, PlantingStatus } from "@/api/types"

export interface PlantingQueryParams {
  fieldId?: string
  cropId?: string
  status?: PlantingStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreatePlantingInput {
  fieldId: string
  cropId: string
  plantingDate: string
  plantedArea: number
  status?: PlantingStatus
}

const base = createCrudService<Planting, CreatePlantingInput>("/plantings")

export const plantingsService = {
  ...base,
  getAll: (params?: PlantingQueryParams) => base.getAll(params),
  updateStatus: (id: string, status: PlantingStatus) =>
    api.patch<never, Planting>(`/plantings/${id}/status`, { status }),
}
