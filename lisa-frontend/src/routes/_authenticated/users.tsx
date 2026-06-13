import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"

import type { User, UserRole } from "@/api/types"
import { usersService } from "@/api/services/users"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader } from "@/components/shared/page-shell"
import { UserFormDialog } from "@/features/users/user-form-dialog"
import { formatDateTime, formatEnumLabel } from "@/lib/format"
import { canManageUsers } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/_authenticated/users")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    if (!canManageUsers(user?.role)) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: UsersPage,
})

function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<UserRole | "ALL">("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      role: role === "ALL" ? undefined : role,
    }),
    [page, search, role]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.getAll(params),
  })

  const deleteMutation = useMutation({
    mutationFn: usersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      notifySuccess("Користувача видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  return (
    <Box>
      <PageHeader
        title="Користувачі"
        description="Керування користувачами та ролями"
        action={
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            Додати користувача
          </Button>
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          placeholder="Пошук користувачів..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          size="small"
          sx={{ maxWidth: { sm: 280 } }}
        />
        <FormControl size="small" sx={{ minWidth: 192 }}>
          <InputLabel id="role-filter-label">Роль</InputLabel>
          <Select
            labelId="role-filter-label"
            label="Роль"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | "ALL")
              setPage(1)
            }}
          >
            <MenuItem value="ALL">Усі ролі</MenuItem>
            <MenuItem value="AGRONOMIST">Агроном</MenuItem>
            <MenuItem value="SALES_MANAGER">Менеджер з продажу</MenuItem>
            <MenuItem value="FARM_MANAGER">Керівник ферми</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (row) => row.fullName },
          { key: "username", header: "Ім'я користувача", cell: (row) => row.username },
          {
            key: "role",
            header: "Роль",
            cell: (row) => formatEnumLabel(row.role),
          },
          {
            key: "created",
            header: "Створено",
            cell: (row) => formatDateTime(row.createdAt),
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(row) => row.id}
        actions={(row) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Button
              size="small"
              onClick={() => {
                setEditing(row)
                setDialogOpen(true)
              }}
            >
              Редагувати
            </Button>
            <Button size="small" color="error" onClick={() => setDeleting(row)}>
              Видалити
            </Button>
          </Stack>
        )}
      />
      <PaginationBar
        page={page}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Видалити користувача"
        description={`Видалити ${deleting?.fullName}? Цю дію не можна скасувати.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
