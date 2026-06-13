import { api, createCrudService } from "@/api/client"
import type { Поле, Planting, WorkRecord } from "@/api/types"

export interface FieldQueryParams {
  search?: string
  location?: string
  page?: number
  limit?: number
}

export interface CreateFieldInput {
  name: string
  area: number
  location: string
  availableArea?: number
  description?: string
}

const base = createCrudService<Field, CreateFieldInput>("/fields")

export const fieldsService = {
  ...base,
  getAll: (params?: FieldQueryParams) => base.getAll(params),
  getPlantings: (id: string) =>
    api.get<never, Planting[]>(`/fields/${id}/plantings`),
  getWorkRecords: (id: string) =>
    api.get<never, WorkRecord[]>(`/fields/${id}/work-records`),
}
