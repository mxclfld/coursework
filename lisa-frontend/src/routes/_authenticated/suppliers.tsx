import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Supplier } from "@/api/types"
import { suppliersService } from "@/api/services/suppliers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { canWriteSuppliers } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  additionalInfo: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/suppliers")({
  component: SuppliersPage,
})

function SuppliersPage() {
  const canWrite = canWriteSuppliers(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined }),
    [page, search]
  )
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => suppliersService.getAll(params),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      name: "",
      contactNumber: "",
      address: "",
      additionalInfo: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? suppliersService.update(editing.id, values)
        : suppliersService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: suppliersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      name: "",
      contactNumber: "",
      address: "",
      additionalInfo: "",
    })
    setOpen(true)
  }

  const openEdit = (row: Supplier) => {
    setEditing(row)
    form.reset({
      name: row.name,
      contactNumber: row.contactNumber ?? "",
      address: row.address ?? "",
      additionalInfo: row.additionalInfo ?? "",
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Постачальники"
        description="Постачальники добрив"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати постачальника
            </Button>
          ) : undefined
        }
      />
      <TextField
        placeholder="Пошук..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        size="small"
        sx={{ mb: 2, maxWidth: 320 }}
        fullWidth
      />
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          {
            key: "contact",
            header: "Контакт",
            cell: (r) => r.contactNumber ?? "—",
          },
          {
            key: "address",
            header: "Адреса",
            cell: (r) => r.address ?? "—",
          },
        ]}
        data={data?.items ?? []}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite
            ? (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openEdit(row)}
                  >
                    Редагувати
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setDeleting(row)}
                  >
                    Видалити
                  </Button>
                </Stack>
              )
            : undefined
        }
      />
      <PaginationBar
        page={page}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogTitle>
            {editing ? "Редагувати постачальника" : "Створити постачальника"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                fullWidth
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                {...form.register("name")}
              />
              <TextField
                label="Контакт"
                fullWidth
                {...form.register("contactNumber")}
              />
              <TextField
                label="Адреса"
                fullWidth
                {...form.register("address")}
              />
              <TextField
                label="Додаткова інформація"
                fullWidth
                multiline
                rows={3}
                {...form.register("additionalInfo")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saveMutation.isPending}
            >
              Зберегти
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Видалити постачальника"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
