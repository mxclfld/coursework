import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material"
import { useState } from "react"

import { reportsService } from "@/api/services/reports"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { StatusChip } from "@/components/shared/status-chip"
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

  const defaultTab = canViewAgronomistReports(role)
    ? "plantings"
    : canViewSalesReports(role)
      ? "purchases"
      : "harvest"

  const [tab, setTab] = useState(defaultTab)

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

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Звіти"
        description="Операційні та фінансові звіти з фільтрами"
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Дата початку"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ maxWidth: 280 }}
        />
        <TextField
          label="Дата закінчення"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ maxWidth: 280 }}
        />
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {canViewAgronomistReports(role) ? (
          <>
            <Tab label="Посіви" value="plantings" />
            <Tab label="Зведення робіт" value="work" />
            <Tab label="Техніка" value="machinery" />
          </>
        ) : null}
        {canViewSalesReports(role) ? (
          <>
            <Tab label="Закупівлі" value="purchases" />
            <Tab label="Продажі" value="sales" />
          </>
        ) : null}
        {canViewFinancialReport(role) ? (
          <Tab label="Фінанси" value="financial" />
        ) : null}
        <Tab label="Врожай" value="harvest" />
      </Tabs>

      {tab === "plantings" && canViewAgronomistReports(role) ? (
        <ReportTable
          query={plantingsQuery}
          columns={[
            {
              key: "field",
              header: "Поле",
              cell: (r) => r.field?.name ?? "—",
            },
            { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
            {
              key: "date",
              header: "Дата",
              cell: (r) => formatDate(r.plantingDate),
            },
            {
              key: "area",
              header: "Площа",
              cell: (r) => formatNumber(r.plantedArea),
            },
            {
              key: "status",
              header: "Статус",
              cell: (r) => <StatusChip status={r.status} />,
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}

      {tab === "work" && canViewAgronomistReports(role) ? (
        <ReportTable
          query={workQuery}
          columns={[
            {
              key: "field",
              header: "Поле",
              cell: (r) => r.field?.name ?? "—",
            },
            {
              key: "work",
              header: "Робота",
              cell: (r) => r.agriculturalWork?.workType ?? "—",
            },
            {
              key: "date",
              header: "Дата",
              cell: (r) => formatDate(r.completionDate),
            },
            {
              key: "machinery",
              header: "Техніка",
              cell: (r) => r.machinery?.name ?? "—",
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}

      {tab === "machinery" && canViewAgronomistReports(role) ? (
        <ReportTable
          query={machineryQuery}
          columns={[
            {
              key: "machinery",
              header: "Техніка",
              cell: (r) => r.machinery?.name ?? "—",
            },
            {
              key: "date",
              header: "Дата",
              cell: (r) => formatDate(r.usageDate),
            },
            {
              key: "hours",
              header: "Години",
              cell: (r) => formatNumber(r.operatingHours),
            },
            {
              key: "field",
              header: "Поле",
              cell: (r) => r.workRecord?.field?.name ?? "—",
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}

      {tab === "purchases" && canViewSalesReports(role) ? (
        <ReportTable
          query={purchasesQuery}
          columns={[
            {
              key: "supplier",
              header: "Supplier",
              cell: (r) => r.supplier?.name ?? "—",
            },
            {
              key: "fertilizer",
              header: "Добриво",
              cell: (r) => r.fertilizer?.name ?? "—",
            },
            {
              key: "total",
              header: "Разом",
              cell: (r) => formatCurrency(r.totalAmount),
            },
            {
              key: "date",
              header: "Дата",
              cell: (r) => formatDate(r.purchaseDate),
            },
            {
              key: "payment",
              header: "Оплата",
              cell: (r) => <StatusChip status={r.paymentStatus} />,
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}

      {tab === "sales" && canViewSalesReports(role) ? (
        <ReportTable
          query={salesQuery}
          columns={[
            {
              key: "buyer",
              header: "Покупець",
              cell: (r) => r.buyer?.name ?? "—",
            },
            { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
            {
              key: "total",
              header: "Разом",
              cell: (r) => formatCurrency(r.totalAmount),
            },
            {
              key: "date",
              header: "Дата",
              cell: (r) => formatDate(r.saleDate),
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}

      {tab === "financial" && canViewFinancialReport(role) ? (
        financialQuery.isLoading ? (
          <PageLoading />
        ) : financialQuery.error ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => financialQuery.refetch()}
              >
                Повторити
              </Button>
            }
          >
            {financialQuery.error.message}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} xl={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Дохід
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(financialQuery.data?.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Витрати
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(financialQuery.data?.totalCosts)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Прибуток
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(financialQuery.data?.profit)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Транзакції
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {financialQuery.data?.salesCount ?? 0} sales ·{" "}
                    {financialQuery.data?.purchasesCount ?? 0} закупівель
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )
      ) : null}

      {tab === "harvest" ? (
        <ReportTable
          query={harvestQuery}
          columns={[
            { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? "—" },
            {
              key: "field",
              header: "Поле",
              cell: (r) => r.field?.name ?? "—",
            },
            {
              key: "total",
              header: "Разом",
              cell: (r) => `${formatNumber(r.totalQuantity)} ${r.unit}`,
            },
            {
              key: "available",
              header: "Доступно",
              cell: (r) => `${formatNumber(r.availableBalance)} ${r.unit}`,
            },
          ]}
          getRowId={(r) => r.id}
        />
      ) : null}
    </Stack>
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
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string
}) {
  return (
    <Box mt={2}>
      <DataTable
        columns={columns}
        data={query.data ?? []}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        getRowId={getRowId}
      />
    </Box>
  )
}
