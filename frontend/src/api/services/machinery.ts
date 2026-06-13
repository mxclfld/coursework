import { api, createCrudService } from "@/api/client"
import type { Техніка, MachineryStatus, MachineryUsage } from "@/api/types"

export interface MachineryQueryParams {
  equipmentType?: string
  status?: MachineryStatus
  search?: string
  page?: number
  limit?: number
}

export interface CreateMachineryInput {
  name: string
  inventoryNumber: string
  equipmentType: string
  purpose?: string
  status?: MachineryStatus
}

const base = createCrudService<Machinery, CreateMachineryInput>("/machinery")

export const machineryService = {
  ...base,
  getAll: (params?: MachineryQueryParams) => base.getAll(params),
  updateStatus: (id: string, status: MachineryStatus) =>
    api.patch<never, Техніка>(`/machinery/${id}/status`, { status }),
  getUsage: (id: string) =>
    api.get<never, MachineryUsage[]>(`/machinery/${id}/usage`),
}
