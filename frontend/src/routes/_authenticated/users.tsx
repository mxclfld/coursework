import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import type { User, UserRole } from "@/api/types"
import { usersService } from "@/api/services/users"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { UserFormDialog } from "@/features/users/user-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
      toast.success("Користувача видалено")
      setDeleting(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader
        title="Користувачі"
        description="Керування користувачами та ролями"
        action={{ label: "Додати користувача", onClick: () => {
          setEditing(null)
          setDialogOpen(true)
        } }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Пошук користувачів..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as UserRole | "ALL")
            setPage(1)
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Усі ролі</SelectItem>
            <SelectItem value="AGRONOMIST">Агроном</SelectItem>
            <SelectItem value="SALES_MANAGER">Менеджер з продажу</SelectItem>
            <SelectItem value="FARM_MANAGER">Керівник ферми</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(row)
                setDialogOpen(true)
              }}
            >
              Редагувати
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleting(row)}
            >
              Видалити
            </Button>
          </div>
        )}
      />
      <div className="mt-4">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Видалити користувача"
        description={`Видалити ${deleting?.fullName}? Цю дію не можна скасувати.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
