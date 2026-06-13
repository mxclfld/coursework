import { api, createCrudService } from "@/api/client"
import type { FertilizerPurchase, PaymentStatus } from "@/api/types"

export interface FertilizerPurchaseQueryParams {
  supplierId?: string
  fertilizerId?: string
  paymentStatus?: PaymentStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreateFertilizerPurchaseInput {
  supplierId: string
  fertilizerId: string
  quantity: number
  unitPrice: number
  purchaseDate: string
  paymentStatus?: PaymentStatus
}

const base = createCrudService<
  FertilizerPurchase,
  CreateFertilizerPurchaseInput
>("/fertilizer-purchases")

export const fertilizerPurchasesService = {
  ...base,
  getAll: (params?: FertilizerPurchaseQueryParams) => base.getAll(params),
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
    api.patch<never, FertilizerPurchase>(
      `/fertilizer-purchases/${id}/payment-status`,
      { paymentStatus }
    ),
}
