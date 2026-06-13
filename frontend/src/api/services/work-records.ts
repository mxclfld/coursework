import { createCrudService } from "@/api/client"
import type { WorkRecord } from "@/api/types"

export interface WorkRecordQueryParams {
  fieldId?: string
  agriculturalWorkId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreateWorkRecordInput {
  fieldId: string
  agriculturalWorkId: string
  machineryId?: string
  completionDate: string
  description?: string
}

const base = createCrudService<WorkRecord, CreateWorkRecordInput>("/work-records")

export const workRecordsService = {
  ...base,
  getAll: (params?: WorkRecordQueryParams) => base.getAll(params),
}
