import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { reportsService } from "@/api/services/reports"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { ErrorState } from "@/components/shared/error-state"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, formatEnumLabel } from "@/lib/format"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportsService.getDashboard(),
  })

  if (isLoading) return <PageLoading />
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Не вдалося завантажити панель"}
        onRetry={() => refetch()}
      />
    )
  }

  const summary = data?.summary ?? {}
  const financial = data?.financial

  return (
    <div>
      <PageHeader
        title="Панель керування"
        description={`Огляд для ${user?.role ? formatEnumLabel(user.role) : "вашої ролі"}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {formatEnumLabel(key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {financial ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Дохід
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCurrency(financial.totalRevenue)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Витрати
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCurrency(financial.totalCosts)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Прибуток
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCurrency(financial.profit)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Транзакції
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {financial.salesCount} продажів · {financial.purchasesCount} закупівель
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
