import { api } from "@/api/client"
import type {
  DashboardResponse,
  FinancialReport,
  FertilizerPurchase,
  HarvestStock,
  MachineryUsage,
  Planting,
  PlantingStatus,
  Sale,
  WorkRecord,
} from "@/api/types"

export interface DateRangeQuery {
  startDate?: string
  endDate?: string
}

export const reportsService = {
  getPlantings: (params?: DateRangeQuery & {
    fieldId?: string
    cropId?: string
    status?: PlantingStatus
  }) => api.get<never, Planting[]>("/reports/plantings", { params }),

  getWorkSummary: (params?: DateRangeQuery & { fieldId?: string }) =>
    api.get<never, WorkRecord[]>("/reports/work-summary", { params }),

  getMachineryUsage: (params?: DateRangeQuery & { machineryId?: string }) =>
    api.get<never, MachineryUsage[]>("/reports/machinery-usage", { params }),

  getPurchases: (params?: DateRangeQuery & { supplierId?: string }) =>
    api.get<never, FertilizerPurchase[]>("/reports/purchases", { params }),

  getSales: (params?: DateRangeQuery & {
    buyerId?: string
    cropId?: string
  }) => api.get<never, Sale[]>("/reports/sales", { params }),

  getFinancial: (params?: DateRangeQuery) =>
    api.get<never, FinancialReport>("/reports/financial", { params }),

  getHarvest: (params?: { cropId?: string; fieldId?: string }) =>
    api.get<never, HarvestStock[]>("/reports/harvest", { params }),

  getDashboard: (params?: DateRangeQuery) =>
    api.get<never, DashboardResponse>("/reports/dashboard", { params }),
}
