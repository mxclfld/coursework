import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { reportsService } from "@/api/services/reports"
import { DataTable } from "@/components/data-table/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageLoading } from "@/components/shared/loading"
import { ErrorState } from "@/components/shared/error-state"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/lib/format"
import {
  canViewAgronomistReports,
  canViewFinancialReport,
  canViewSalesReports,
} from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
})

function ReportsPage() {
  const role = useAuthStore((s) => s.user?.role)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const dateParams = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  const plantingsQuery = useQuery({
    queryKey: ["reports", "plantings", dateParams],
    queryFn: () => reportsService.getPlantings(dateParams),
    enabled: canViewAgronomistReports(role),
  })
  const workQuery = useQuery({
    queryKey: ["reports", "work-summary", dateParams],
    queryFn: () => reportsService.getWorkSummary(dateParams),
    enabled: canViewAgronomistReports(role),
  })
  const machineryQuery = useQuery({
    queryKey: ["reports", "machinery-usage", dateParams],
    queryFn: () => reportsService.getMachineryUsage(dateParams),
    enabled: canViewAgronomistReports(role),
  })
  const purchasesQuery = useQuery({
    queryKey: ["reports", "purchases", dateParams],
    queryFn: () => reportsService.getPurchases(dateParams),
    enabled: canViewSalesReports(role),
  })
  const salesQuery = useQuery({
    queryKey: ["reports", "sales", dateParams],
    queryFn: () => reportsService.getSales(dateParams),
    enabled: canViewSalesReports(role),
  })
  const financialQuery = useQuery({
    queryKey: ["reports", "financial", dateParams],
    queryFn: () => reportsService.getFinancial(dateParams),
    enabled: canViewFinancialReport(role),
  })
  const harvestQuery = useQuery({
    queryKey: ["reports", "harvest"],
    queryFn: () => reportsService.getHarvest(),
  })

  const defaultTab = canViewAgronomistReports(role)
    ? "plantings"
    : canViewSalesReports(role)
      ? "purchases"
      : "harvest"

  return (
    <div>
      <PageHeader
        title="Звіти"
        description="Операційні та фінансові звіти з фільтрами"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="sm:max-w-xs"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex h-auto flex-wrap">
          {canViewAgronomistReports(role) ? (
            <>
              <TabsTrigger value="plantings">Посіви</TabsTrigger>
              <TabsTrigger value="work">Зведення робіт</TabsTrigger>
              <TabsTrigger value="machinery">Техніка</TabsTrigger>
            </>
          ) : null}
          {canViewSalesReports(role) ? (
            <>
              <TabsTrigger value="purchases">Закупівлі</TabsTrigger>
              <TabsTrigger value="sales">Продажі</TabsTrigger>
            </>
          ) : null}
          {canViewFinancialReport(role) ? (
            <TabsTrigger value="financial">Фінанси</TabsTrigger>
          ) : null}
          <TabsTrigger value="harvest">Врожай</TabsTrigger>
        </TabsList>

        {canViewAgronomistReports(role) ? (
          <>
            <TabsContent value="plantings" className="mt-4">
              <ReportTable
                query={plantingsQuery}
                columns={[
                  { key: "field", header: "Поле", cell: (r) => r.field?.name ?? "—" },
                  { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
                  { key: "date", header: "Дата", cell: (r) => formatDate(r.plantingDate) },
                  { key: "area", header: "Площа", cell: (r) => formatNumber(r.plantedArea) },
                  { key: "status", header: "Статус", cell: (r) => <StatusBadge status={r.status} /> },
                ]}
                getRowId={(r) => r.id}
              />
            </TabsContent>
            <TabsContent value="work" className="mt-4">
              <ReportTable
                query={workQuery}
                columns={[
                  { key: "field", header: "Поле", cell: (r) => r.field?.name ?? "—" },
                  { key: "work", header: "Робота", cell: (r) => r.agriculturalWork?.workType ?? "—" },
                  { key: "date", header: "Дата", cell: (r) => formatDate(r.completionDate) },
                  { key: "machinery", header: "Техніка", cell: (r) => r.machinery?.name ?? "—" },
                ]}
                getRowId={(r) => r.id}
              />
            </TabsContent>
            <TabsContent value="machinery" className="mt-4">
              <ReportTable
                query={machineryQuery}
                columns={[
                  { key: "machinery", header: "Техніка", cell: (r) => r.machinery?.name ?? "—" },
                  { key: "date", header: "Дата", cell: (r) => formatDate(r.usageDate) },
                  { key: "hours", header: "Години", cell: (r) => formatNumber(r.operatingHours) },
                  { key: "field", header: "Поле", cell: (r) => r.workRecord?.field?.name ?? "—" },
                ]}
                getRowId={(r) => r.id}
              />
            </TabsContent>
          </>
        ) : null}

        {canViewSalesReports(role) ? (
          <>
            <TabsContent value="purchases" className="mt-4">
              <ReportTable
                query={purchasesQuery}
                columns={[
                  { key: "supplier", header: "Постачальник", cell: (r) => r.supplier?.name ?? "—" },
                  { key: "fertilizer", header: "Добриво", cell: (r) => r.fertilizer?.name ?? "—" },
                  { key: "total", header: "Разом", cell: (r) => formatCurrency(r.totalAmount) },
                  { key: "date", header: "Дата", cell: (r) => formatDate(r.purchaseDate) },
                  { key: "payment", header: "Оплата", cell: (r) => <StatusBadge status={r.paymentStatus} /> },
                ]}
                getRowId={(r) => r.id}
              />
            </TabsContent>
            <TabsContent value="sales" className="mt-4">
              <ReportTable
                query={salesQuery}
                columns={[
                  { key: "buyer", header: "Покупець", cell: (r) => r.buyer?.name ?? "—" },
                  { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
                  { key: "total", header: "Разом", cell: (r) => formatCurrency(r.totalAmount) },
                  { key: "date", header: "Дата", cell: (r) => formatDate(r.saleDate) },
                ]}
                getRowId={(r) => r.id}
              />
            </TabsContent>
          </>
        ) : null}

        {canViewFinancialReport(role) ? (
          <TabsContent value="financial" className="mt-4">
            {financialQuery.isLoading ? (
              <PageLoading />
            ) : financialQuery.error ? (
              <ErrorState message={financialQuery.error.message} onRetry={() => financialQuery.refetch()} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Дохід</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(financialQuery.data?.totalRevenue)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Витрати</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(financialQuery.data?.totalCosts)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Прибуток</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(financialQuery.data?.profit)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Транзакції</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {financialQuery.data?.salesCount ?? 0} продажів · {financialQuery.data?.purchasesCount ?? 0} закупівель
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="harvest" className="mt-4">
          <ReportTable
            query={harvestQuery}
            columns={[
              { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
              { key: "field", header: "Поле", cell: (r) => r.field?.name ?? "—" },
              { key: "total", header: "Разом", cell: (r) => `${formatNumber(r.totalQuantity)} ${r.unit}` },
              { key: "available", header: "Доступно", cell: (r) => `${formatNumber(r.availableBalance)} ${r.unit}` },
            ]}
            getRowId={(r) => r.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportTable<T>({
  query,
  columns,
  getRowId,
}: {
  query: {
    data?: T[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }
  columns: import("@/components/data-table/data-table").ColumnDef<T>[]
  getRowId: (row: T) => string
}) {
  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => query.refetch()}
      getRowId={getRowId}
    />
  )
}
