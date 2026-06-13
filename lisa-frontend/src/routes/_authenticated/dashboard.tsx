import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material"

import { reportsService } from "@/api/services/reports"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
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
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Повторити
          </Button>
        }
      >
        {error instanceof Error ? error.message : "Не вдалося завантажити панель"}
      </Alert>
    )
  }

  const summary = data?.summary ?? {}
  const financial = data?.financial

  return (
    <Box>
      <PageHeader
        title="Панель керування"
        description={`Огляд для ${user?.role ? formatEnumLabel(user.role) : "вашої ролі"}`}
      />
      <Grid container spacing={2}>
        {Object.entries(summary).map(([key, value]) => (
          <Grid key={key} item xs={12} sm={6} xl={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatEnumLabel(key)}
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {financial ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} xl={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Дохід
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {formatCurrency(financial.totalRevenue)}
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
                <Typography variant="h5" fontWeight={600}>
                  {formatCurrency(financial.totalCosts)}
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
                <Typography variant="h5" fontWeight={600}>
                  {formatCurrency(financial.profit)}
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
                  {financial.salesCount} продажів · {financial.purchasesCount} закупівель
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  )
}
