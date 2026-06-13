import { createCrudService } from "@/api/client"
import type { MachineryUsage } from "@/api/types"

export interface MachineryUsageQueryParams {
  machineryId?: string
  workRecordId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreateMachineryUsageInput {
  machineryId: string
  workRecordId: string
  usageDate: string
  operatingHours: number
}

const base = createCrudService<MachineryUsage, CreateMachineryUsageInput>(
  "/machinery-usage"
)

export const machineryUsageService = {
  ...base,
  getAll: (params?: MachineryUsageQueryParams) => base.getAll(params),
}
