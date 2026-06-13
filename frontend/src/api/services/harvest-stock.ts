import { api, createCrudService } from "@/api/client"
import type { HarvestStock } from "@/api/types"

export interface HarvestStockQueryParams {
  cropId?: string
  fieldId?: string
  page?: number
  limit?: number
}

export interface CreateHarvestStockInput {
  cropId: string
  fieldId: string
  totalQuantity: number
  availableBalance?: number
  unit: string
}

const base = createCrudService<HarvestStock, CreateHarvestStockInput>(
  "/harvest-stock"
)

export const harvestStockService = {
  ...base,
  getAll: (params?: HarvestStockQueryParams) => base.getAll(params),
  adjust: (id: string, adjustment: number) =>
    api.post<never, HarvestStock>(`/harvest-stock/${id}/adjust`, {
      adjustment,
    }),
}
